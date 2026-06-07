package com.HeartFeel.web.controller;

import com.HeartFeel.web.common.BaseResponse;
import com.HeartFeel.web.common.ResultUtils;
import com.HeartFeel.web.model.dto.qwerty.TtsSynthesizeRequest;
import com.HeartFeel.web.model.vo.TtsSynthesizeVO;
import com.HeartFeel.web.service.TtsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * Qwerty trainer TTS APIs.
 */
@RestController
@RequestMapping("/qwerty/tts")
public class TtsController {

    @Resource
    private TtsService ttsService;

    @PostMapping("/synthesize")
    public BaseResponse<TtsSynthesizeVO> synthesize(@RequestBody TtsSynthesizeRequest request) {
        return ResultUtils.success(ttsService.synthesize(request));
    }
}
