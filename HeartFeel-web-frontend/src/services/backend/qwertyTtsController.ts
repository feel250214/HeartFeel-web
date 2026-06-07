// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** synthesize POST /api/qwerty/tts/synthesize */
export async function synthesizeTtsUsingPost(
  body: API.TtsSynthesizeRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseTtsSynthesizeVO_>('/api/qwerty/tts/synthesize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
