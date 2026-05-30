import { BACKEND_HOST_LOCAL, BACKEND_HOST_PROD, COS_HOST } from '@/constants';

const getBackendHost = () => {
  return process.env.NODE_ENV === 'development' ? BACKEND_HOST_LOCAL : BACKEND_HOST_PROD;
};

const getCosFilePath = (path?: string) => {
  if (!path) {
    return undefined;
  }
  if (!/^https?:\/\//.test(path)) {
    return path;
  }
  try {
    const url = new URL(path);
    const cosUrl = new URL(COS_HOST);
    if (url.host === cosUrl.host) {
      return decodeURIComponent(url.pathname);
    }
  } catch (error) {
    return undefined;
  }
  return undefined;
};

export const getFileViewUrl = (path?: string) => {
  const filePath = getCosFilePath(path);
  if (!filePath) {
    return path;
  }
  return `${getBackendHost()}/api/file/view?filepath=${encodeURIComponent(filePath)}`;
};

export const getCosUrl = (path?: string) => {
  if (!path) {
    return undefined;
  }
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return `${COS_HOST}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getDailyCoverUrl = (daily?: API.DailyVO) => {
  return getFileViewUrl(daily?.coverPath || daily?.coverUrl || daily?.cover);
};
