// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** deleteDictionary POST /api/qwerty/dictionary/delete */
export async function deleteDictionaryUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/qwerty/dictionary/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** getDictionaryContent GET /api/qwerty/dictionary/get/content */
export async function getDictionaryContentUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDictionaryContentUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListQwertyWordVO_>('/api/qwerty/dictionary/get/content', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** listDictionaryVOByPage POST /api/qwerty/dictionary/list/page/vo */
export async function listDictionaryVoByPageUsingPost(
  body: API.QwertyDictionaryQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageQwertyDictionaryVO_>('/api/qwerty/dictionary/list/page/vo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** updateDictionary POST /api/qwerty/dictionary/update */
export async function updateDictionaryUsingPost(
  body: API.QwertyDictionaryUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/qwerty/dictionary/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** uploadDictionary POST /api/qwerty/dictionary/upload */
export async function uploadDictionaryUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.uploadDictionaryUsingPOSTParams,
  body: {},
  file?: File,
  options?: { [key: string]: any },
) {
  const formData = new FormData();

  if (file) {
    formData.append('file', file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ''));
        } else {
          formData.append(ele, new Blob([JSON.stringify(item)], { type: 'application/json' }));
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<API.BaseResponseLong_>('/api/qwerty/dictionary/upload', {
    method: 'POST',
    params: {
      ...params,
    },
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}
