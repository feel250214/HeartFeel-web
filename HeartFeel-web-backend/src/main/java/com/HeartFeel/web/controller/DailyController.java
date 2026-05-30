package com.HeartFeel.web.controller;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.HeartFeel.web.annotation.AuthCheck;
import com.HeartFeel.web.common.BaseResponse;
import com.HeartFeel.web.common.DeleteRequest;
import com.HeartFeel.web.common.ErrorCode;
import com.HeartFeel.web.common.ResultUtils;
import com.HeartFeel.web.config.CosClientConfig;
import com.HeartFeel.web.constant.UserConstant;
import com.HeartFeel.web.exception.BusinessException;
import com.HeartFeel.web.exception.ThrowUtils;
import com.HeartFeel.web.manager.CacheManager;
import com.HeartFeel.web.manager.CosManager;
import com.HeartFeel.web.model.dto.daily.DailyAddRequest;
import com.HeartFeel.web.model.dto.daily.DailyEditRequest;
import com.HeartFeel.web.model.dto.daily.DailyQueryRequest;
import com.HeartFeel.web.model.dto.daily.DailyUpdateRequest;
import com.HeartFeel.web.model.entity.Daily;
import com.HeartFeel.web.model.entity.User;
import com.HeartFeel.web.model.vo.DailyVO;
import com.HeartFeel.web.service.DailyService;
import com.HeartFeel.web.service.UserService;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qcloud.cos.exception.CosClientException;
import com.qcloud.cos.exception.CosServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * Daily diary API.
 */
@RestController
@RequestMapping("/daily")
@Slf4j
public class DailyController {

    private static final String DAILY_COS_DIR = "/daily";

    @Resource
    private DailyService dailyService;

    @Resource
    private UserService userService;

    @Resource
    private CosManager cosManager;

    @Resource
    private CosClientConfig cosClientConfig;

    @Resource
    private CacheManager cacheManager;

    /**
     * Create a diary. The ByteMD markdown content is stored as a local .md file
     * and uploaded to COS. The COS key is saved in distPath.
     */
    @PostMapping("/add")
    public BaseResponse<Long> addDaily(@RequestBody DailyAddRequest dailyAddRequest, HttpServletRequest request) {
        if (dailyAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Daily daily = new Daily();
        BeanUtils.copyProperties(dailyAddRequest, daily);

        dailyService.validDaily(daily, true);
        User loginUser = userService.getLoginUser(request);
        daily.setUserId(loginUser.getId());
        daily.setStatus(dailyAddRequest.getStatus() == null ? 0 : dailyAddRequest.getStatus());
        boolean saveResult = dailyService.save(daily);
        ThrowUtils.throwIf(!saveResult, ErrorCode.OPERATION_ERROR);

        Long dailyId = daily.getId();
        String distPath = StrUtil.blankToDefault(dailyAddRequest.getDistPath(),
                buildDailyDistPath(loginUser.getId(), dailyId));
        try {
            if (dailyAddRequest.getContent() != null || StrUtil.isBlank(dailyAddRequest.getDistPath())) {
                saveDailyContent(distPath, dailyAddRequest.getContent());
            }
            Daily updateDaily = new Daily();
            updateDaily.setId(dailyId);
            updateDaily.setDistPath(distPath);
            boolean updateResult = dailyService.updateById(updateDaily);
            ThrowUtils.throwIf(!updateResult, ErrorCode.OPERATION_ERROR);
        } catch (Exception e) {
            dailyService.removeById(dailyId);
            deleteLocalDailyFile(distPath);
            log.error("daily content upload error, dailyId = {}, distPath = {}", dailyId, distPath, e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "daily upload failed", e);
        }
        return ResultUtils.success(dailyId);
    }

    /**
     * Delete a diary and its local/COS markdown file.
     */
    @PostMapping("/delete")
    public BaseResponse<Boolean> deleteDaily(@RequestBody DeleteRequest deleteRequest, HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        long id = deleteRequest.getId();
        Daily oldDaily = dailyService.getById(id);
        ThrowUtils.throwIf(oldDaily == null, ErrorCode.NOT_FOUND_ERROR);
        checkDailyOwnerOrAdmin(oldDaily, loginUser);

        boolean result = dailyService.removeById(id);
        if (result) {
            deleteDailyStorage(oldDaily.getDistPath());
        }
        return ResultUtils.success(result);
    }

    /**
     * Update a diary as admin.
     */
    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> updateDaily(@RequestBody DailyUpdateRequest dailyUpdateRequest) {
        if (dailyUpdateRequest == null || dailyUpdateRequest.getId() == null || dailyUpdateRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Daily oldDaily = dailyService.getById(dailyUpdateRequest.getId());
        ThrowUtils.throwIf(oldDaily == null, ErrorCode.NOT_FOUND_ERROR);

        Daily daily = new Daily();
        BeanUtils.copyProperties(dailyUpdateRequest, daily);
        if (StrUtil.isBlank(daily.getDistPath())) {
            daily.setDistPath(null);
        }
        dailyService.validDaily(daily, false);
        updateDailyContentIfNeeded(dailyUpdateRequest.getContent(), daily, oldDaily);
        boolean result = dailyService.updateById(daily);
        return ResultUtils.success(result);
    }

    /**
     * Get diary metadata and markdown content.
     */
    @GetMapping("/get/vo")
    public BaseResponse<DailyVO> getDailyVOById(long id, HttpServletRequest request) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        Daily daily = dailyService.getById(id);
        ThrowUtils.throwIf(daily == null, ErrorCode.NOT_FOUND_ERROR);
        checkDailyOwnerOrAdmin(daily, loginUser);

        DailyVO dailyVO = dailyService.getDailyVO(daily, request);
        dailyVO.setContent(getDailyContent(daily.getDistPath()));
        return ResultUtils.success(dailyVO);
    }

    /**
     * Get only the markdown content. Local cache is used first; COS is used as
     * fallback and then written back to local cache.
     */
    @GetMapping("/get/content")
    public BaseResponse<String> getDailyContentById(long id, HttpServletRequest request) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        Daily daily = dailyService.getById(id);
        ThrowUtils.throwIf(daily == null, ErrorCode.NOT_FOUND_ERROR);
        checkDailyOwnerOrAdmin(daily, loginUser);
        return ResultUtils.success(getDailyContent(daily.getDistPath()));
    }

    /**
     * List diaries.
     */
    @PostMapping("/list/page/vo")
    public BaseResponse<Page<DailyVO>> listDailyVOByPage(@RequestBody DailyQueryRequest dailyQueryRequest,
                                                         HttpServletRequest request) {
        if (dailyQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = dailyQueryRequest.getCurrent();
        long size = dailyQueryRequest.getPageSize();
        ThrowUtils.throwIf(size > 20, ErrorCode.PARAMS_ERROR);

        String cacheKey = getPageCacheKey(dailyQueryRequest);
        Object cacheValue = cacheManager.get(cacheKey);
        if (cacheValue != null) {
            return ResultUtils.success((Page<DailyVO>) cacheValue);
        }

        QueryWrapper<Daily> queryWrapper = dailyService.getQueryWrapper(dailyQueryRequest);
        queryWrapper.select("id", "name", "distPath", "coverPath", "status", "userId", "createTime", "updateTime");
        Page<Daily> dailyPage = dailyService.page(new Page<>(current, size), queryWrapper);
        Page<DailyVO> dailyVOPage = dailyService.getDailyVOPage(dailyPage, request);
        cacheManager.put(cacheKey, dailyVOPage);
        return ResultUtils.success(dailyVOPage);
    }

    /**
     * List current user's diaries.
     */
    @PostMapping("/my/list/page/vo")
    public BaseResponse<Page<DailyVO>> listMyDailyVOByPage(@RequestBody DailyQueryRequest dailyQueryRequest,
                                                           HttpServletRequest request) {
        if (dailyQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        dailyQueryRequest.setUserId(loginUser.getId());
        long current = dailyQueryRequest.getCurrent();
        long size = dailyQueryRequest.getPageSize();
        ThrowUtils.throwIf(size > 20, ErrorCode.PARAMS_ERROR);
        Page<Daily> dailyPage = dailyService.page(new Page<>(current, size),
                dailyService.getQueryWrapper(dailyQueryRequest));
        return ResultUtils.success(dailyService.getDailyVOPage(dailyPage, request));
    }

    /**
     * List current user's diaries that can be selected as new diary templates.
     */
    @PostMapping("/template/list/page/vo")
    public BaseResponse<Page<DailyVO>> listMyDailyTemplateVOByPage(@RequestBody DailyQueryRequest dailyQueryRequest,
                                                                   HttpServletRequest request) {
        if (dailyQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        dailyQueryRequest.setUserId(loginUser.getId());
        long current = dailyQueryRequest.getCurrent();
        long size = dailyQueryRequest.getPageSize();
        ThrowUtils.throwIf(size > 20, ErrorCode.PARAMS_ERROR);

        QueryWrapper<Daily> queryWrapper = dailyService.getQueryWrapper(dailyQueryRequest);
        queryWrapper.select("id", "name", "distPath", "coverPath", "status", "userId", "createTime", "updateTime");
        if (StrUtil.isBlank(dailyQueryRequest.getSortField())) {
            queryWrapper.orderByDesc("updateTime");
        }
        Page<Daily> dailyPage = dailyService.page(new Page<>(current, size), queryWrapper);
        return ResultUtils.success(dailyService.getDailyVOPage(dailyPage, request));
    }

    /**
     * Get a selected diary template with markdown content.
     */
    @GetMapping("/template/get/vo")
    public BaseResponse<DailyVO> getDailyTemplateVOById(long id, HttpServletRequest request) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        Daily daily = dailyService.getById(id);
        ThrowUtils.throwIf(daily == null, ErrorCode.NOT_FOUND_ERROR);
        checkDailyOwnerOrAdmin(daily, loginUser);

        DailyVO dailyVO = dailyService.getDailyVO(daily, request);
        dailyVO.setContent(getDailyContent(daily.getDistPath()));
        return ResultUtils.success(dailyVO);
    }

    /**
     * Edit a diary as owner.
     */
    @PostMapping("/edit")
    public BaseResponse<Boolean> editDaily(@RequestBody DailyEditRequest dailyEditRequest, HttpServletRequest request) {
        if (dailyEditRequest == null || dailyEditRequest.getId() == null || dailyEditRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        long id = dailyEditRequest.getId();
        Daily oldDaily = dailyService.getById(id);
        ThrowUtils.throwIf(oldDaily == null, ErrorCode.NOT_FOUND_ERROR);
        checkDailyOwnerOrAdmin(oldDaily, loginUser);

        Daily daily = new Daily();
        BeanUtils.copyProperties(dailyEditRequest, daily);
        if (StrUtil.isBlank(daily.getDistPath())) {
            daily.setDistPath(null);
        }
        dailyService.validDaily(daily, false);
        updateDailyContentIfNeeded(dailyEditRequest.getContent(), daily, oldDaily);
        boolean result = dailyService.updateById(daily);
        return ResultUtils.success(result);
    }

    /**
     * Download the markdown file.
     */
    @GetMapping("/download")
    public void downloadDailyById(long id, HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        Daily daily = dailyService.getById(id);
        ThrowUtils.throwIf(daily == null, ErrorCode.NOT_FOUND_ERROR);
        checkDailyOwnerOrAdmin(daily, loginUser);

        String localFilePath = getLocalDailyFilePath(daily.getDistPath());
        if (!FileUtil.exist(localFilePath)) {
            downloadDailyContentFromCos(daily.getDistPath(), localFilePath);
        }
        String filename = StrUtil.blankToDefault(daily.getName(), "daily") + ".md";
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8.name());
        response.setContentType("text/markdown;charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=" + encodedFilename);
        Files.copy(Paths.get(localFilePath), response.getOutputStream());
    }

    private void updateDailyContentIfNeeded(String content, Daily daily, Daily oldDaily) {
        if (content == null) {
            return;
        }
        String distPath = StrUtil.blankToDefault(daily.getDistPath(), oldDaily.getDistPath());
        if (StrUtil.isBlank(distPath)) {
            distPath = buildDailyDistPath(oldDaily.getUserId(), oldDaily.getId());
        }
        saveDailyContent(distPath, content);
        daily.setDistPath(distPath);
    }

    private void saveDailyContent(String distPath, String content) {
        if (StrUtil.isBlank(distPath)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "daily path is blank");
        }
        String localFilePath = getLocalDailyFilePath(distPath);
        File localFile = FileUtil.touch(localFilePath);
        FileUtil.writeUtf8String(content == null ? "" : content, localFile);
        String cosKey = cosManager.normalizeKey(distPath);
        try {
            cosManager.putObject(distPath, localFile);
        } catch (CosServiceException e) {
            logCosServiceException("upload", distPath, cosKey, localFile, e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "daily upload failed", e);
        } catch (CosClientException e) {
            logCosClientException("upload", distPath, cosKey, localFile, e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "daily upload failed", e);
        } catch (Exception e) {
            log.error("daily cos upload error, bucket = {}, region = {}, distPath = {}, cosKey = {}, "
                            + "localFilePath = {}, localFileExists = {}, localFileSize = {}",
                    cosClientConfig.getBucket(), cosClientConfig.getRegion(), distPath, cosKey,
                    localFile.getAbsolutePath(), localFile.exists(), localFile.length(), e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "daily upload failed", e);
        }
    }

    private String getDailyContent(String distPath) {
        if (StrUtil.isBlank(distPath)) {
            return "";
        }
        String localFilePath = getLocalDailyFilePath(distPath);
        if (!FileUtil.exist(localFilePath)) {
            downloadDailyContentFromCos(distPath, localFilePath);
        }
        return FileUtil.readString(localFilePath, StandardCharsets.UTF_8);
    }

    private void downloadDailyContentFromCos(String distPath, String localFilePath) {
        FileUtil.mkParentDirs(FileUtil.file(localFilePath));
        try {
            cosManager.download(distPath, localFilePath);
        } catch (CosServiceException e) {
            logCosServiceException("download", distPath, cosManager.normalizeKey(distPath), FileUtil.file(localFilePath), e);
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "daily content not found", e);
        } catch (CosClientException e) {
            logCosClientException("download", distPath, cosManager.normalizeKey(distPath), FileUtil.file(localFilePath), e);
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "daily content not found", e);
        } catch (Exception e) {
            log.error("daily cos download error, bucket = {}, region = {}, distPath = {}, cosKey = {}, "
                            + "localFilePath = {}",
                    cosClientConfig.getBucket(), cosClientConfig.getRegion(), distPath,
                    cosManager.normalizeKey(distPath), localFilePath, e);
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "daily content not found", e);
        }
    }

    private void deleteDailyStorage(String distPath) {
        if (StrUtil.isBlank(distPath)) {
            return;
        }
        deleteLocalDailyFile(distPath);
        try {
            cosManager.deleteObject(distPath);
        } catch (CosServiceException e) {
            logCosServiceException("delete", distPath, cosManager.normalizeKey(distPath), null, e);
        } catch (Exception e) {
            log.warn("daily cos delete error, bucket = {}, region = {}, distPath = {}, cosKey = {}",
                    cosClientConfig.getBucket(), cosClientConfig.getRegion(), distPath,
                    cosManager.normalizeKey(distPath), e);
        }
    }

    private void logCosServiceException(String action, String distPath, String cosKey, File localFile,
                                        CosServiceException e) {
        log.error("daily cos {} service error, bucket = {}, region = {}, distPath = {}, cosKey = {}, "
                        + "localFilePath = {}, localFileExists = {}, localFileSize = {}, statusCode = {}, "
                        + "errorCode = {}, errorMessage = {}, requestId = {}, traceId = {}, rawResponse = {}",
                action, cosClientConfig.getBucket(), cosClientConfig.getRegion(), distPath, cosKey,
                localFile == null ? null : localFile.getAbsolutePath(),
                localFile == null ? null : localFile.exists(),
                localFile == null ? null : localFile.length(),
                e.getStatusCode(), e.getErrorCode(), e.getErrorMessage(), e.getRequestId(), e.getTraceId(),
                e.getRawResponseContent(), e);
    }

    private void logCosClientException(String action, String distPath, String cosKey, File localFile,
                                       CosClientException e) {
        log.error("daily cos {} client error, bucket = {}, region = {}, distPath = {}, cosKey = {}, "
                        + "localFilePath = {}, localFileExists = {}, localFileSize = {}, errorCode = {}, "
                        + "retryable = {}, message = {}",
                action, cosClientConfig.getBucket(), cosClientConfig.getRegion(), distPath, cosKey,
                localFile == null ? null : localFile.getAbsolutePath(),
                localFile == null ? null : localFile.exists(),
                localFile == null ? null : localFile.length(),
                e.getErrorCode(), e.isRetryable(), e.getMessage(), e);
    }

    private void deleteLocalDailyFile(String distPath) {
        if (StrUtil.isBlank(distPath)) {
            return;
        }
        FileUtil.del(getLocalDailyFilePath(distPath));
    }

    private void checkDailyOwnerOrAdmin(Daily daily, User loginUser) {
        if (daily == null || loginUser == null) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
        }
        if (!loginUser.getId().equals(daily.getUserId()) && !userService.isAdmin(loginUser)) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
        }
    }

    private String buildDailyDistPath(Long userId, Long dailyId) {
        return String.format("%s/%s/%s.md", DAILY_COS_DIR, userId, dailyId);
    }

    private String getLocalDailyFilePath(String distPath) {
        String projectPath = System.getProperty("user.dir");
        String normalizedPath = normalizeStoragePath(distPath);
        return String.format("%s/.temp/daily/%s", projectPath, normalizedPath);
    }

    private String normalizeStoragePath(String distPath) {
        if (StrUtil.isBlank(distPath)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "daily path is blank");
        }
        String normalizedPath = distPath.replace("\\", "/");
        while (normalizedPath.startsWith("/")) {
            normalizedPath = normalizedPath.substring(1);
        }
        if (normalizedPath.contains("../") || normalizedPath.contains("..\\")) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "daily path is invalid");
        }
        return normalizedPath;
    }

    private static String getPageCacheKey(DailyQueryRequest dailyQueryRequest) {
        return "daily:page:" + JSONUtil.toJsonStr(dailyQueryRequest);
    }
}
