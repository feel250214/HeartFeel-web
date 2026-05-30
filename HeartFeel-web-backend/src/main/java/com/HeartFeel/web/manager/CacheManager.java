package com.HeartFeel.web.manager;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.concurrent.TimeUnit;

/**
 * Cache 对象存储操作
 *
 * @author <a href="https://github.com/feel250214">感受是什麽</a>
 */
@Component
public class CacheManager {

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    Cache<String, Object> localCache = Caffeine.newBuilder()
            .expireAfterWrite(100, TimeUnit.MINUTES)
            .maximumSize(10_000)
            .build();

    /**
     * 写入本地缓存
     *
     * @param key
     * @param value
     */
    public void put(String key, Object value) {
        // 添加或者更新一个缓存元素
        System.out.println("=== put key: " + key);
        localCache.put(key, value);
        redisTemplate.opsForValue().set(key, value, 100, TimeUnit.MINUTES);
    }

    /**
     * 获取缓存
     *
     * @param key
     * @return
     */
    public Object get(String key) {
        // 先从本地缓存中获取
        // 查找缓存，如果缓存不存在则生成缓存元素,  如果无法生成则返回null
        System.out.println("=== get key: " + key);
        Object value = localCache.getIfPresent(key);
        if (value != null) {
            return value;
        }

        // 本地未命中，从Redis中获取
        value = redisTemplate.opsForValue().get(key);
        if (value != null) {
            // 将redis的值写入本地
            localCache.put(key, value);
        }
        return value;

    }

    /**
     * 移除缓存
     *
     * @param key
     */
    public void delete(String key) {
        localCache.invalidate(key);
        redisTemplate.delete(key);
    }
}
