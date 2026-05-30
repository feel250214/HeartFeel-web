package com.HeartFeel.web.controller;

import cn.hutool.core.io.FileUtil;
import com.qcloud.cos.model.COSObject;
import com.qcloud.cos.model.COSObjectInputStream;
import com.qcloud.cos.utils.IOUtils;
import com.HeartFeel.web.annotation.AuthCheck;
import com.HeartFeel.web.common.BaseResponse;
import com.HeartFeel.web.common.ErrorCode;
import com.HeartFeel.web.common.ResultUtils;
import com.HeartFeel.web.constant.FileConstant;
import com.HeartFeel.web.constant.UserConstant;
import com.HeartFeel.web.exception.BusinessException;
import com.HeartFeel.web.manager.CosManager;
import com.HeartFeel.web.model.dto.file.UploadFileRequest;
import com.HeartFeel.web.model.entity.Daily;
import com.HeartFeel.web.model.entity.User;
import com.HeartFeel.web.model.enums.FileUploadBizEnum;
import com.HeartFeel.web.model.vo.UploadFileVO;
import com.HeartFeel.web.service.DailyService;
import com.HeartFeel.web.service.UserService;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.Locale;

/**
 * 文件接口
 *
 * @author <a href="https://github.com/feel250214">感受是什麽</a>
 */
@RestController
@RequestMapping("/file")
@Slf4j
public class FileController {

    @Resource
    private UserService userService;

    @Resource
    private CosManager cosManager;

    @Resource
    private DailyService dailyService;

    /**
     * 测试文件上传
     *
     * @param multipartFile
     * @return
     */
    @PostMapping("/test/upload")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<String> testUploadFile(@RequestPart("file") MultipartFile multipartFile) {
        String filename = multipartFile.getOriginalFilename();
        String filepath = String.format("/test/%s", filename);
        File file = null;
        try {
            // 上传文件
            file = File.createTempFile(filepath, null);
            multipartFile.transferTo(file);
            cosManager.putObject(filepath, file);
            // 返回可访问地址
            return ResultUtils.success(filepath);
        } catch (Exception e) {
            log.error("file upload error, filepath = " + filepath, e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "上传失败");
        } finally {
            if (file != null) {
                // 删除临时文件
                boolean delete = file.delete();
                if (!delete) {
                    log.error("file delete error, filepath = {}", filepath);
                }
            }
        }
    }

    /**
     * 测试文件下载
     *
     * @param filepath
     * @param response
     * @return
     */
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    @GetMapping("/test/download/")
    public void testDownloadFile(String filepath, HttpServletResponse response) throws IOException {
        COSObjectInputStream cosObjectInput = null;
        try {
            COSObject cosObject = cosManager.getObject(filepath);
            cosObjectInput = cosObject.getObjectContent();
            // 处理下载到的流
            byte[] bytes = IOUtils.toByteArray(cosObjectInput);
            // 设置响应头
            response.setContentType("application/octet-stream;charset=UTF-8");
            response.setHeader("Content-Disposition", "attachment; filename=" + filepath);
            // 写入响应
            response.getOutputStream().write(bytes);
            response.getOutputStream().flush();
        } catch (Exception e) {
            log.error("file download error, filepath = " + filepath, e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "下载失败");
        } finally {
            if (cosObjectInput != null) {
                cosObjectInput.close();
            }
        }
    }


    /**
     * 文件上传
     *
     * @param multipartFile
     * @param uploadFileRequest
     * @param request
     * @return
     */
    @PostMapping("/upload")
    public BaseResponse<String> uploadFile(@RequestPart("file") MultipartFile multipartFile,
                                           UploadFileRequest uploadFileRequest, HttpServletRequest request) {
        UploadFileVO uploadFileVO = doUploadFile(multipartFile, uploadFileRequest, request);
        return ResultUtils.success(uploadFileVO.getFilePath());
    }

    @PostMapping("/upload/vo")
    public BaseResponse<UploadFileVO> uploadFileVO(@RequestPart("file") MultipartFile multipartFile,
                                                   UploadFileRequest uploadFileRequest, HttpServletRequest request) {
        return ResultUtils.success(doUploadFile(multipartFile, uploadFileRequest, request));
    }

    @GetMapping("/view")
    public void viewFile(String filepath, HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (filepath == null || filepath.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        checkFileReadable(filepath, loginUser);

        COSObjectInputStream cosObjectInput = null;
        try {
            COSObject cosObject = cosManager.getObject(filepath);
            cosObjectInput = cosObject.getObjectContent();
            byte[] bytes = IOUtils.toByteArray(cosObjectInput);
            response.setContentType(getPreviewContentType(filepath));
            response.setContentLength(bytes.length);
            response.setHeader("Cache-Control", "private, max-age=3600");
            response.getOutputStream().write(bytes);
            response.getOutputStream().flush();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("file view error, filepath = {}", filepath, e);
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "file not found", e);
        } finally {
            if (cosObjectInput != null) {
                cosObjectInput.close();
            }
        }
    }

    private UploadFileVO doUploadFile(MultipartFile multipartFile, UploadFileRequest uploadFileRequest,
                                      HttpServletRequest request) {
        if (uploadFileRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String biz = uploadFileRequest.getBiz();
        FileUploadBizEnum fileUploadBizEnum = FileUploadBizEnum.getEnumByValue(biz);
        if (fileUploadBizEnum == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        validFile(multipartFile, fileUploadBizEnum);
        User loginUser = userService.getLoginUser(request);
        // 文件目录：根据业务、用户来划分
        String uuid = RandomStringUtils.randomAlphanumeric(8);
        String filename = uuid + "-" + multipartFile.getOriginalFilename();
        String filepath = String.format("/%s/%s/%s", fileUploadBizEnum.getValue(), loginUser.getId(), filename);
        File file = null;
        try {
            // 上传文件
            file = File.createTempFile(filepath, null);
            multipartFile.transferTo(file);
            cosManager.putObject(filepath, file);
            // 返回可访问地址
            bindDailyCoverIfNeeded(filepath, uploadFileRequest, fileUploadBizEnum, loginUser);
            UploadFileVO uploadFileVO = new UploadFileVO();
            uploadFileVO.setFilePath(filepath);
            uploadFileVO.setUrl(cosManager.buildPublicUrl(filepath));
            return uploadFileVO;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("file upload error, filepath = " + filepath, e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "上传失败");
        } finally {
            if (file != null) {
                // 删除临时文件
                boolean delete = file.delete();
                if (!delete) {
                    log.error("file delete error, filepath = {}", filepath);
                }
            }
        }
    }

    private void bindDailyCoverIfNeeded(String filepath, UploadFileRequest uploadFileRequest,
                                        FileUploadBizEnum fileUploadBizEnum, User loginUser) {
        if (!FileUploadBizEnum.DAILY_COVER.equals(fileUploadBizEnum)) {
            return;
        }
        Long dailyId = uploadFileRequest.getDailyId();
        if (dailyId == null || dailyId <= 0) {
            return;
        }
        Daily oldDaily = dailyService.getById(dailyId);
        if (oldDaily == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        if (!loginUser.getId().equals(oldDaily.getUserId()) && !userService.isAdmin(loginUser)) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
        }
        Daily daily = new Daily();
        daily.setId(dailyId);
        daily.setCoverPath(filepath);
        boolean result = dailyService.updateById(daily);
        if (!result) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "cover path save failed");
        }
    }

    /**
     * 校验文件
     *
     * @param multipartFile
     * @param fileUploadBizEnum 业务类型
     */
    private void checkFileReadable(String filepath, User loginUser) {
        String normalizedPath = cosManager.normalizeKey(filepath);
        String dailyCoverPrefix = FileUploadBizEnum.DAILY_COVER.getValue() + "/";
        if (normalizedPath.startsWith(dailyCoverPrefix)) {
            String currentUserPrefix = dailyCoverPrefix + loginUser.getId() + "/";
            if (!normalizedPath.startsWith(currentUserPrefix) && !userService.isAdmin(loginUser)) {
                throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
            }
        }
    }

    private String getPreviewContentType(String filepath) {
        String fileSuffix = FileUtil.getSuffix(filepath);
        if (fileSuffix == null) {
            return "application/octet-stream";
        }
        switch (fileSuffix.toLowerCase(Locale.ROOT)) {
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "webp":
                return "image/webp";
            case "svg":
                return "image/svg+xml";
            default:
                return "application/octet-stream";
        }
    }

    private void validFile(MultipartFile multipartFile, FileUploadBizEnum fileUploadBizEnum) {
        // 文件大小
        long fileSize = multipartFile.getSize();
        // 文件后缀
        String fileSuffix = FileUtil.getSuffix(multipartFile.getOriginalFilename());
        if (fileSuffix != null) {
            fileSuffix = fileSuffix.toLowerCase(Locale.ROOT);
        }
        final long ONE_M = 1024 * 1024L;
        if (FileUploadBizEnum.USER_AVATAR.equals(fileUploadBizEnum)) {
            if (fileSize > ONE_M) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件大小不能超过 1M");
            }
            if (!Arrays.asList("jpeg", "jpg", "svg", "png", "webp").contains(fileSuffix)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件类型错误");
            }
        }
        if (FileUploadBizEnum.DAILY_COVER.equals(fileUploadBizEnum)) {
            if (fileSize > 5 * ONE_M) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "cover image must be no larger than 5M");
            }
            if (!Arrays.asList("jpeg", "jpg", "png").contains(fileSuffix)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "cover image must be jpeg, jpg, or png");
            }
            try {
                BufferedImage image = ImageIO.read(multipartFile.getInputStream());
                if (image == null || image.getWidth() <= 0 || image.getHeight() <= 0) {
                    throw new BusinessException(ErrorCode.PARAMS_ERROR, "cover image is invalid");
                }
                if (image.getWidth() * 3 != image.getHeight() * 4) {
                    throw new BusinessException(ErrorCode.PARAMS_ERROR, "cover image ratio must be 4:3");
                }
            } catch (IOException e) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "cover image is invalid", e);
            }
        }
    }
}
