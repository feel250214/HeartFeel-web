declare namespace API {
  type BaseResponseBoolean_ = {
    code?: number;
    data?: boolean;
    message?: string;
  };

  type BaseResponseDailyVO_ = {
    code?: number;
    data?: DailyVO;
    message?: string;
  };

  type BaseResponseGeneratorVO_ = {
    code?: number;
    data?: GeneratorVO;
    message?: string;
  };

  type BaseResponseListQwertyWordVO_ = {
    code?: number;
    data?: QwertyWordVO[];
    message?: string;
  };

  type BaseResponseLoginUserVO_ = {
    code?: number;
    data?: LoginUserVO;
    message?: string;
  };

  type BaseResponseLong_ = {
    code?: number;
    data?: number;
    message?: string;
  };

  type BaseResponsePageDailyVO_ = {
    code?: number;
    data?: PageDailyVO_;
    message?: string;
  };

  type BaseResponsePageGenerator_ = {
    code?: number;
    data?: PageGenerator_;
    message?: string;
  };

  type BaseResponsePageGeneratorVO_ = {
    code?: number;
    data?: PageGeneratorVO_;
    message?: string;
  };

  type BaseResponsePageQwertyDictionaryVO_ = {
    code?: number;
    data?: PageQwertyDictionaryVO_;
    message?: string;
  };

  type BaseResponsePageUser_ = {
    code?: number;
    data?: PageUser_;
    message?: string;
  };

  type BaseResponsePageUserVO_ = {
    code?: number;
    data?: PageUserVO_;
    message?: string;
  };

  type BaseResponseString_ = {
    code?: number;
    data?: string;
    message?: string;
  };

  type BaseResponseTtsSynthesizeVO_ = {
    code?: number;
    data?: TtsSynthesizeVO;
    message?: string;
  };

  type BaseResponseUploadFileVO_ = {
    code?: number;
    data?: UploadFileVO;
    message?: string;
  };

  type BaseResponseUser_ = {
    code?: number;
    data?: User;
    message?: string;
  };

  type BaseResponseUserVO_ = {
    code?: number;
    data?: UserVO;
    message?: string;
  };

  type DailyAddRequest = {
    content?: string;
    coverPath?: string;
    distPath?: string;
    name?: string;
    status?: number;
    userId?: number;
  };

  type DailyEditRequest = {
    content?: string;
    coverPath?: string;
    distPath?: string;
    id?: number;
    name?: string;
  };

  type DailyQueryRequest = {
    coverPath?: string;
    current?: number;
    distPath?: string;
    id?: number;
    name?: string;
    notId?: number;
    pageSize?: number;
    searchText?: string;
    sortField?: string;
    sortOrder?: string;
    status?: number;
    userId?: number;
  };

  type DailyUpdateRequest = {
    content?: string;
    coverPath?: string;
    distPath?: string;
    id?: number;
    name?: string;
    status?: number;
  };

  type DailyVO = {
    content?: string;
    cover?: string;
    coverPath?: string;
    coverUrl?: string;
    createTime?: string;
    distPath?: string;
    id?: number;
    name?: string;
    status?: number;
    updateTime?: string;
    user?: UserVO;
    userId?: number;
  };

  type DeleteRequest = {
    id?: number;
  };

  type downloadDailyByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type downloadGeneratorByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type FileConfig = {
    files?: FileInfo[];
    inputRootPath?: string;
    outputRootPath?: string;
    sourceRootPath?: string;
    type?: string;
  };

  type FileInfo = {
    condition?: string;
    files?: FileInfo[];
    generateType?: string;
    groupKey?: string;
    groupName?: string;
    inputPath?: string;
    outputPath?: string;
    type?: string;
  };

  type Generator = {
    author?: string;
    basePackage?: string;
    createTime?: string;
    description?: string;
    distPath?: string;
    fileConfig?: string;
    id?: number;
    isDelete?: number;
    modelConfig?: string;
    name?: string;
    picture?: string;
    status?: number;
    tags?: string;
    updateTime?: string;
    userId?: number;
    version?: string;
  };

  type GeneratorAddRequest = {
    author?: string;
    basePackage?: string;
    description?: string;
    distPath?: string;
    fileConfig?: FileConfig;
    modelConfig?: ModelConfig;
    name?: string;
    picture?: string;
    status?: number;
    tags?: string[];
    userId?: number;
    version?: string;
  };

  type GeneratorCacheRequest = {
    id?: number;
  };

  type GeneratorEditRequest = {
    author?: string;
    basePackage?: string;
    description?: string;
    distPath?: string;
    fileConfig?: FileConfig;
    id?: number;
    modelConfig?: ModelConfig;
    name?: string;
    picture?: string;
    tags?: string[];
    version?: string;
  };

  type GeneratorMakeRequest = {
    meta?: Meta;
    zipFilePath?: string;
  };

  type GeneratorQueryRequest = {
    author?: string;
    basePackage?: string;
    current?: number;
    description?: string;
    distPath?: string;
    id?: number;
    name?: string;
    notId?: number;
    orTags?: string[];
    pageSize?: number;
    searchText?: string;
    sortField?: string;
    sortOrder?: string;
    status?: number;
    tags?: string[];
    userId?: number;
    version?: string;
  };

  type GeneratorUpdateRequest = {
    author?: string;
    basePackage?: string;
    description?: string;
    distPath?: string;
    fileConfig?: FileConfig;
    id?: number;
    modelConfig?: ModelConfig;
    name?: string;
    picture?: string;
    status?: number;
    tags?: string[];
    version?: string;
  };

  type GeneratorUseRequest = {
    dataModel?: Record<string, any>;
    id?: number;
  };

  type GeneratorVO = {
    author?: string;
    basePackage?: string;
    createTime?: string;
    description?: string;
    distPath?: string;
    fileConfig?: FileConfig;
    id?: number;
    modelConfig?: ModelConfig;
    name?: string;
    picture?: string;
    status?: number;
    tags?: string[];
    updateTime?: string;
    user?: UserVO;
    userId?: number;
    version?: string;
  };

  type getDailyContentByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getDailyTemplateVOByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getDailyVOByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getDictionaryContentUsingGETParams = {
    /** id */
    id?: number;
  };

  type getGeneratorVOByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getUserByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getUserVOByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type LoginUserVO = {
    createTime?: string;
    id?: number;
    updateTime?: string;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type Meta = {
    author?: string;
    basePackage?: string;
    createTime?: string;
    description?: string;
    fileConfig?: FileConfig;
    modelConfig?: ModelConfig;
    name?: string;
    version?: string;
  };

  type ModelConfig = {
    models?: ModelInfo[];
  };

  type ModelInfo = {
    abbr?: string;
    allArgsStr?: string;
    condition?: string;
    defaultValue?: Record<string, any>;
    description?: string;
    fieldName?: string;
    groupKey?: string;
    groupName?: string;
    models?: ModelInfo[];
    type?: string;
  };

  type OrderItem = {
    asc?: boolean;
    column?: string;
  };

  type PageDailyVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: DailyVO[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PageGenerator_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: Generator[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PageGeneratorVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: GeneratorVO[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PageQwertyDictionaryVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: QwertyDictionaryVO[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PageUser_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: User[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PageUserVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: UserVO[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type QwertyDictionaryQueryRequest = {
    category?: string;
    current?: number;
    id?: number;
    language?: string;
    languageCategory?: string;
    name?: string;
    notId?: number;
    pageSize?: number;
    searchText?: string;
    sortField?: string;
    sortOrder?: string;
    status?: number;
    userId?: number;
    visibility?: string;
  };

  type QwertyDictionaryUpdateRequest = {
    category?: string;
    description?: string;
    id?: number;
    language?: string;
    languageCategory?: string;
    name?: string;
    status?: number;
    visibility?: string;
  };

  type QwertyDictionaryVO = {
    category?: string;
    createTime?: string;
    description?: string;
    id?: number;
    language?: string;
    languageCategory?: string;
    name?: string;
    status?: number;
    updateTime?: string;
    user?: UserVO;
    userId?: number;
    visibility?: string;
    wordCount?: number;
  };

  type QwertyWordVO = {
    examples?: string[];
    name?: string;
    tags?: string[];
    trans?: string[];
    ukphone?: string;
    usphone?: string;
  };

  type testDownloadFileUsingGETParams = {
    /** filepath */
    filepath?: string;
  };

  type TtsSynthesizeRequest = {
    language?: string;
    rate?: number;
    text?: string;
  };

  type TtsSynthesizeVO = {
    audioBase64?: string;
    cacheKey?: string;
    engine?: string;
    mimeType?: string;
  };

  type uploadDictionaryUsingPOSTParams = {
    category?: string;
    description?: string;
    language?: string;
    languageCategory?: string;
    name?: string;
    visibility?: string;
  };

  type uploadFileUsingPOSTParams = {
    biz?: string;
    dailyId?: number;
  };

  type UploadFileVO = {
    filePath?: string;
    url?: string;
  };

  type uploadFileVOUsingPOSTParams = {
    biz?: string;
    dailyId?: number;
  };

  type User = {
    createTime?: string;
    id?: number;
    isDelete?: number;
    updateTime?: string;
    userAccount?: string;
    userAvatar?: string;
    userName?: string;
    userPassword?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserAddRequest = {
    userAccount?: string;
    userAvatar?: string;
    userName?: string;
    userRole?: string;
  };

  type UserLoginRequest = {
    userAccount?: string;
    userPassword?: string;
  };

  type UserQueryRequest = {
    current?: number;
    id?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserRegisterRequest = {
    checkPassword?: string;
    userAccount?: string;
    userPassword?: string;
  };

  type UserUpdateMyRequest = {
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
  };

  type UserUpdateRequest = {
    id?: number;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserVO = {
    createTime?: string;
    id?: number;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type viewFileUsingGETParams = {
    /** filepath */
    filepath?: string;
  };
}
