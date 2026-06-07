package com.HeartFeel.web.controller;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.alibaba.excel.EasyExcel;
import com.HeartFeel.web.common.BaseResponse;
import com.HeartFeel.web.common.DeleteRequest;
import com.HeartFeel.web.common.ErrorCode;
import com.HeartFeel.web.common.ResultUtils;
import com.HeartFeel.web.exception.BusinessException;
import com.HeartFeel.web.exception.ThrowUtils;
import com.HeartFeel.web.manager.CosManager;
import com.HeartFeel.web.model.dto.qwerty.QwertyDictionaryQueryRequest;
import com.HeartFeel.web.model.dto.qwerty.QwertyDictionaryUpdateRequest;
import com.HeartFeel.web.model.dto.qwerty.QwertyDictionaryUploadRequest;
import com.HeartFeel.web.model.entity.QwertyDictionary;
import com.HeartFeel.web.model.entity.User;
import com.HeartFeel.web.model.vo.QwertyDictionaryVO;
import com.HeartFeel.web.model.vo.QwertyWordVO;
import com.HeartFeel.web.service.QwertyDictionaryService;
import com.HeartFeel.web.service.UserService;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qcloud.cos.model.COSObject;
import com.qcloud.cos.model.COSObjectInputStream;
import com.qcloud.cos.utils.IOUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Qwerty trainer dictionary APIs.
 */
@RestController
@RequestMapping("/qwerty/dictionary")
@Slf4j
public class QwertyDictionaryController {

    private static final String QWERTY_DICT_COS_DIR = "/qwerty_dictionary";

    private static final long MAX_DICTIONARY_SIZE = 2 * 1024 * 1024L;

    @Resource
    private QwertyDictionaryService qwertyDictionaryService;

    @Resource
    private UserService userService;

    @Resource
    private CosManager cosManager;

    @PostMapping("/upload")
    public BaseResponse<Long> uploadDictionary(@RequestPart("file") MultipartFile multipartFile,
                                               QwertyDictionaryUploadRequest uploadRequest,
                                               HttpServletRequest request) {
        if (multipartFile == null || multipartFile.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary file is empty");
        }
        validDictionaryFile(multipartFile);
        User loginUser = userService.getLoginUser(request);
        List<QwertyWordVO> words = parseDictionaryFile(multipartFile);

        String filePath = buildDictionaryFilePath(loginUser.getId(), multipartFile.getOriginalFilename());
        File tempFile = null;
        try {
            tempFile = File.createTempFile("qwerty-dict-", "." + getDictionaryFileSuffix(multipartFile.getOriginalFilename()));
            multipartFile.transferTo(tempFile);
            cosManager.putObject(filePath, tempFile);
        } catch (Exception e) {
            log.error("qwerty dictionary upload error, filePath = {}", filePath, e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "dictionary upload failed", e);
        } finally {
            if (tempFile != null && !tempFile.delete()) {
                log.warn("qwerty dictionary temp file delete failed, path = {}", tempFile.getAbsolutePath());
            }
        }

        QwertyDictionary dictionary = new QwertyDictionary();
        dictionary.setName(getDictionaryName(uploadRequest, multipartFile));
        dictionary.setDescription(uploadRequest == null ? null : uploadRequest.getDescription());
        dictionary.setCategory(StrUtil.blankToDefault(uploadRequest == null ? null : uploadRequest.getCategory(),
                "Custom"));
        dictionary.setLanguage(StrUtil.blankToDefault(uploadRequest == null ? null : uploadRequest.getLanguage(),
                "en"));
        dictionary.setLanguageCategory(StrUtil.blankToDefault(uploadRequest == null ? null
                : uploadRequest.getLanguageCategory(), "custom"));
        dictionary.setVisibility(StrUtil.blankToDefault(uploadRequest == null ? null : uploadRequest.getVisibility(),
                QwertyDictionaryService.VISIBILITY_PRIVATE));
        dictionary.setStatus(0);
        dictionary.setWordCount(words.size());
        dictionary.setFilePath(filePath);
        dictionary.setUserId(loginUser.getId());
        qwertyDictionaryService.validDictionary(dictionary, true);
        boolean result = qwertyDictionaryService.save(dictionary);
        if (!result) {
            tryDeleteCosFile(filePath);
            throw new BusinessException(ErrorCode.OPERATION_ERROR);
        }
        return ResultUtils.success(dictionary.getId());
    }

    @PostMapping("/list/page/vo")
    public BaseResponse<Page<QwertyDictionaryVO>> listDictionaryVOByPage(
            @RequestBody QwertyDictionaryQueryRequest queryRequest, HttpServletRequest request) {
        if (queryRequest == null) {
            queryRequest = new QwertyDictionaryQueryRequest();
        }
        User loginUser = userService.getLoginUser(request);
        long current = queryRequest.getCurrent();
        long size = queryRequest.getPageSize();
        ThrowUtils.throwIf(size > 50, ErrorCode.PARAMS_ERROR);

        if (queryRequest.getStatus() == null) {
            queryRequest.setStatus(0);
        }
        QueryWrapper<QwertyDictionary> queryWrapper = qwertyDictionaryService.getQueryWrapper(queryRequest);
        queryWrapper.and(qw -> qw.in("visibility", Arrays.asList(QwertyDictionaryService.VISIBILITY_PUBLIC,
                        QwertyDictionaryService.VISIBILITY_PUBLIC_LEGACY,
                        QwertyDictionaryService.VISIBILITY_PUBLIC_CN))
                .or().eq("userId", loginUser.getId()));
        if (StrUtil.isBlank(queryRequest.getSortField())) {
            queryWrapper.orderByDesc("updateTime");
        }
        Page<QwertyDictionary> dictionaryPage = qwertyDictionaryService.page(new Page<>(current, size),
                queryWrapper);
        return ResultUtils.success(qwertyDictionaryService.getDictionaryVOPage(dictionaryPage, request));
    }

    @GetMapping("/get/content")
    public BaseResponse<List<QwertyWordVO>> getDictionaryContent(long id, HttpServletRequest request) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        QwertyDictionary dictionary = qwertyDictionaryService.getById(id);
        ThrowUtils.throwIf(dictionary == null, ErrorCode.NOT_FOUND_ERROR);
        checkDictionaryReadable(dictionary, loginUser);
        return ResultUtils.success(parseDictionaryContent(dictionary.getFilePath(), readCosBytes(dictionary.getFilePath())));
    }

    @PostMapping("/update")
    public BaseResponse<Boolean> updateDictionary(@RequestBody QwertyDictionaryUpdateRequest updateRequest,
                                                  HttpServletRequest request) {
        if (updateRequest == null || updateRequest.getId() == null || updateRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        QwertyDictionary oldDictionary = qwertyDictionaryService.getById(updateRequest.getId());
        ThrowUtils.throwIf(oldDictionary == null, ErrorCode.NOT_FOUND_ERROR);
        checkDictionaryOwnerOrAdmin(oldDictionary, loginUser);

        QwertyDictionary dictionary = new QwertyDictionary();
        BeanUtils.copyProperties(updateRequest, dictionary);
        qwertyDictionaryService.validDictionary(dictionary, false);
        boolean result = qwertyDictionaryService.updateById(dictionary);
        return ResultUtils.success(result);
    }

    @PostMapping("/delete")
    public BaseResponse<Boolean> deleteDictionary(@RequestBody DeleteRequest deleteRequest,
                                                  HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        QwertyDictionary dictionary = qwertyDictionaryService.getById(deleteRequest.getId());
        ThrowUtils.throwIf(dictionary == null, ErrorCode.NOT_FOUND_ERROR);
        checkDictionaryOwnerOrAdmin(dictionary, loginUser);
        boolean result = qwertyDictionaryService.removeById(deleteRequest.getId());
        if (result) {
            tryDeleteCosFile(dictionary.getFilePath());
        }
        return ResultUtils.success(result);
    }

    private void validDictionaryFile(MultipartFile multipartFile) {
        if (multipartFile.getSize() > MAX_DICTIONARY_SIZE) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary file must be no larger than 2MB");
        }
        String suffix = FileUtil.getSuffix(multipartFile.getOriginalFilename());
        if (suffix == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary file must be xlsx or json");
        }
        String normalizedSuffix = suffix.toLowerCase(Locale.ROOT);
        if (!"xlsx".equals(normalizedSuffix) && !"json".equals(normalizedSuffix)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary file must be xlsx or json");
        }
    }

    private List<QwertyWordVO> parseDictionaryFile(MultipartFile multipartFile) {
        String suffix = getDictionaryFileSuffix(multipartFile.getOriginalFilename());
        try {
            if ("xlsx".equals(suffix)) {
                return parseExcelWords(multipartFile.getInputStream());
            }
            return parseJsonWords(readMultipartFile(multipartFile));
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary file parse failed", e);
        }
    }

    private List<QwertyWordVO> parseDictionaryContent(String filePath, byte[] bytes) {
        String suffix = getDictionaryFileSuffix(filePath);
        if ("xlsx".equals(suffix)) {
            return parseExcelWords(new ByteArrayInputStream(bytes));
        }
        return parseJsonWords(new String(bytes, StandardCharsets.UTF_8));
    }

    private String readMultipartFile(MultipartFile multipartFile) {
        try {
            return new String(multipartFile.getBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary file read failed", e);
        }
    }

    private byte[] readCosBytes(String filePath) {
        COSObjectInputStream cosObjectInput = null;
        try {
            COSObject cosObject = cosManager.getObject(filePath);
            cosObjectInput = cosObject.getObjectContent();
            return IOUtils.toByteArray(cosObjectInput);
        } catch (Exception e) {
            log.error("qwerty dictionary content read error, filePath = {}", filePath, e);
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "dictionary content not found", e);
        } finally {
            if (cosObjectInput != null) {
                try {
                    cosObjectInput.close();
                } catch (Exception e) {
                    log.warn("qwerty dictionary cos stream close failed", e);
                }
            }
        }
    }

    private List<QwertyWordVO> parseJsonWords(String rawJson) {
        JSONArray array;
        try {
            array = JSONUtil.parseArray(rawJson);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary content must be a JSON array", e);
        }
        if (array.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary must contain at least one word");
        }
        List<QwertyWordVO> words = new ArrayList<>();
        for (Object rawItem : array) {
            if (!(rawItem instanceof JSONObject)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary word item must be object");
            }
            JSONObject item = (JSONObject) rawItem;
            String name = StrUtil.trim(item.getStr("name"));
            if (StrUtil.isBlank(name)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary word name is required");
            }
            QwertyWordVO word = new QwertyWordVO();
            word.setName(name);
            word.setTrans(normalizeStringList(item.get("trans")));
            word.setUsphone(StrUtil.emptyToNull(item.getStr("usphone")));
            word.setUkphone(StrUtil.emptyToNull(item.getStr("ukphone")));
            word.setTags(normalizeStringList(item.get("tags")));
            word.setExamples(normalizeStringList(item.get("examples")));
            words.add(word);
        }
        return words;
    }

    private List<QwertyWordVO> parseExcelWords(InputStream inputStream) {
        List<Map<Integer, String>> rows;
        try {
            rows = EasyExcel.read(inputStream).sheet(0).headRowNumber(1).doReadSync();
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary excel file parse failed", e);
        }
        if (rows == null || rows.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary must contain at least one word");
        }
        List<QwertyWordVO> words = new ArrayList<>();
        for (Map<Integer, String> row : rows) {
            String name = StrUtil.trim(getExcelCell(row, 0));
            if (StrUtil.isBlank(name)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary word name is required");
            }
            QwertyWordVO word = new QwertyWordVO();
            word.setName(name);
            word.setTrans(normalizeDelimitedString(getExcelCell(row, 1)));
            word.setUsphone(StrUtil.emptyToNull(getExcelCell(row, 2)));
            word.setUkphone(StrUtil.emptyToNull(getExcelCell(row, 3)));
            word.setTags(normalizeDelimitedString(getExcelCell(row, 4)));
            word.setExamples(normalizeDelimitedString(getExcelCell(row, 5)));
            words.add(word);
        }
        return words;
    }

    private String getExcelCell(Map<Integer, String> row, int index) {
        if (row == null) {
            return null;
        }
        String value = row.get(index);
        return value == null ? null : value.trim();
    }

    private List<String> normalizeStringList(Object rawValue) {
        List<String> list = new ArrayList<>();
        if (rawValue == null) {
            return list;
        }
        if (rawValue instanceof JSONArray) {
            JSONArray array = (JSONArray) rawValue;
            for (Object item : array) {
                if (item != null && StrUtil.isNotBlank(String.valueOf(item))) {
                    list.add(String.valueOf(item).trim());
                }
            }
            return list;
        }
        if (rawValue instanceof Iterable) {
            for (Object item : (Iterable<?>) rawValue) {
                if (item != null && StrUtil.isNotBlank(String.valueOf(item))) {
                    list.add(String.valueOf(item).trim());
                }
            }
            return list;
        }
        if (rawValue instanceof CharSequence) {
            return normalizeDelimitedString(String.valueOf(rawValue));
        }
        String value = String.valueOf(rawValue).trim();
        if (StrUtil.isNotBlank(value)) {
            list.add(value);
        }
        return list;
    }

    private List<String> normalizeDelimitedString(String rawValue) {
        List<String> list = new ArrayList<>();
        if (StrUtil.isBlank(rawValue)) {
            return list;
        }
        String[] values = rawValue.split("\\r?\\n|;|；");
        for (String value : values) {
            String trimmedValue = StrUtil.trim(value);
            if (StrUtil.isNotBlank(trimmedValue)) {
                list.add(trimmedValue);
            }
        }
        return list;
    }

    private void checkDictionaryReadable(QwertyDictionary dictionary, User loginUser) {
        if (isPublicVisibility(dictionary.getVisibility())) {
            return;
        }
        checkDictionaryOwnerOrAdmin(dictionary, loginUser);
    }

    private boolean isPublicVisibility(String visibility) {
        return QwertyDictionaryService.VISIBILITY_PUBLIC.equals(visibility)
                || QwertyDictionaryService.VISIBILITY_PUBLIC_LEGACY.equals(visibility)
                || QwertyDictionaryService.VISIBILITY_PUBLIC_CN.equals(visibility);
    }

    private void checkDictionaryOwnerOrAdmin(QwertyDictionary dictionary, User loginUser) {
        if (dictionary == null || loginUser == null) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
        }
        if (!loginUser.getId().equals(dictionary.getUserId()) && !userService.isAdmin(loginUser)) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
        }
    }

    private String getDictionaryName(QwertyDictionaryUploadRequest uploadRequest, MultipartFile multipartFile) {
        if (uploadRequest != null && StrUtil.isNotBlank(uploadRequest.getName())) {
            return uploadRequest.getName().trim();
        }
        String filename = multipartFile.getOriginalFilename();
        if (StrUtil.isBlank(filename)) {
            return "Custom Dictionary";
        }
        return filename.replaceAll("(?i)\\.(json|xlsx)$", "");
    }

    private String buildDictionaryFilePath(Long userId, String originalFilename) {
        String safeSuffix = getDictionaryFileSuffix(originalFilename);
        String uuid = RandomStringUtils.randomAlphanumeric(8);
        return String.format("%s/%s/%s.%s", QWERTY_DICT_COS_DIR, userId, uuid, safeSuffix);
    }

    private String getDictionaryFileSuffix(String filename) {
        String suffix = FileUtil.getSuffix(filename);
        return StrUtil.blankToDefault(suffix, "xlsx").toLowerCase(Locale.ROOT);
    }

    private void tryDeleteCosFile(String filePath) {
        if (StrUtil.isBlank(filePath)) {
            return;
        }
        try {
            cosManager.deleteObject(filePath);
        } catch (Exception e) {
            log.warn("qwerty dictionary cos delete failed, filePath = {}", filePath, e);
        }
    }
}
