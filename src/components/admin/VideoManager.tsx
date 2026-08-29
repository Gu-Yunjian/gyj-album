'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  canonicalizeBilibiliUrl,
  isB23Url,
  normalizeVideoConfig,
  parseExternalVideoUrl,
  parseBilibiliUrl,
  type VideoEntry,
  type VideoProvider,
} from '@/lib/bilibili';

interface ApiError {
  error?: string;
  url?: string;
}

export default function VideoManager() {
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState<VideoProvider>('bilibili');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  const loadVideos = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch('/content/videos.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('加载失败');
      setVideos(normalizeVideoConfig(await response.json()));
    } catch (error) {
      console.error('Failed to load video config:', error);
      setMessage('❌ 视频配置加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  async function resolveBilibiliUrl(rawUrl: string) {
    if (!isB23Url(rawUrl)) {
      const parsed = parseBilibiliUrl(rawUrl);
      return parsed ? canonicalizeBilibiliUrl(parsed) : null;
    }

    const response = await fetch('/api/admin/videos/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: rawUrl }),
    });
    const result = await response.json() as ApiError;

    if (!response.ok || !result.url) {
      throw new Error(result.error || '无法解析短链接');
    }

    return result.url;
  }

  function resolveExternalUrl(rawUrl: string) {
    return parseExternalVideoUrl(rawUrl);
  }

  async function addVideo() {
    const nextTitle = title.trim();
    const rawUrl = url.trim();

    if (!nextTitle || !rawUrl) {
      setMessage('❌ 请填写标题和视频地址');
      return;
    }

    setAdding(true);
    setMessage('');

    try {
      const canonicalUrl = provider === 'bilibili'
        ? await resolveBilibiliUrl(rawUrl)
        : resolveExternalUrl(rawUrl);

      if (!canonicalUrl) {
        setMessage(provider === 'bilibili'
          ? '❌ 请输入有效的 B 站视频链接'
          : '❌ 请输入有效的 HTTPS MP4 地址');
        return;
      }

      if (videos.some(video => video.url === canonicalUrl)) {
        setMessage('❌ 该视频已经在列表中');
        return;
      }

      setVideos(previous => [
        ...previous,
        { title: nextTitle, url: canonicalUrl, provider },
      ]);
      setTitle('');
      setUrl('');
      setMessage('✅ 视频已添加，记得保存');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '添加失败';
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setAdding(false);
    }
  }

  function updateTitle(index: number, nextTitle: string) {
    setVideos(previous => previous.map((video, videoIndex) => (
      videoIndex === index ? { ...video, title: nextTitle } : video
    )));
  }

  function moveVideo(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    setVideos(previous => {
      const nextVideos = [...previous];
      [nextVideos[index], nextVideos[targetIndex]] = [
        nextVideos[targetIndex],
        nextVideos[index],
      ];
      return nextVideos;
    });
    setMessage('✅ 视频顺序已调整，记得保存');
  }

  function removeVideo(index: number) {
    setVideos(previous => previous.filter((_, videoIndex) => videoIndex !== index));
    setMessage('✅ 视频已删除，记得保存');
  }

  async function saveVideos() {
    const normalizedVideos = normalizeVideoConfig({ videos });

    if (normalizedVideos.length !== videos.length) {
      setMessage('❌ 请补全所有视频标题');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'public/content/videos.json',
          content: JSON.stringify({ videos: normalizedVideos }, null, 2),
        }),
      });

      if (!response.ok) throw new Error('保存失败');
      setVideos(normalizedVideos);
      setMessage('✅ 视频已保存！记得 git push 部署');
    } catch (error) {
      console.error('Failed to save video config:', error);
      setMessage('❌ 视频保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <section style={{
        background: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '16px',
        }}>
          <div>
            <h2 style={{ margin: '0 0 4px' }}>视频管理</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
              添加 B 站或外部 MP4 地址，保存后随静态站点一起部署
            </p>
          </div>
          <button
            type="button"
            onClick={saveVideos}
            disabled={saving || loading}
            style={{
              padding: '10px 20px',
              background: saving || loading ? '#ccc' : '#52c41a',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: saving || loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {saving ? '保存中...' : '💾 保存视频'}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <select
            value={provider}
            onChange={event => setProvider(event.target.value as VideoProvider)}
            aria-label="视频来源"
            style={{
              flex: '0 1 150px',
              minWidth: '150px',
              padding: '10px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              background: '#fff',
            }}
          >
            <option value="bilibili">B 站视频</option>
            <option value="mp4">外部 MP4</option>
          </select>
          <input
            type="text"
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="视频标题"
            style={{
              flex: '1 1 220px',
              minWidth: 0,
              padding: '10px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
            }}
          />
          <input
            type="url"
            value={url}
            onChange={event => setUrl(event.target.value)}
            placeholder={provider === 'bilibili'
              ? 'B 站链接（支持 b23.tv）'
              : 'HTTPS MP4 地址（例如 COS 链接）'}
            style={{
              flex: '2 1 360px',
              minWidth: 0,
              padding: '10px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
            }}
          />
          <button
            type="button"
            onClick={addVideo}
            disabled={adding}
            style={{
              padding: '10px 20px',
              background: adding ? '#ccc' : '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: adding ? 'not-allowed' : 'pointer',
            }}
          >
            {adding ? '处理中...' : '+ 添加视频'}
          </button>
        </div>

        {message && (
          <p style={{
            margin: '12px 0 0',
            color: message.startsWith('❌') ? '#cf1322' : '#389e0d',
            fontSize: '13px',
          }}>
            {message}
          </p>
        )}
      </section>

      <section>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            加载中...
          </div>
        ) : videos.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            background: '#f9f9f9',
            borderRadius: '8px',
            color: '#999',
          }}>
            暂无视频
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {videos.map((video, index) => (
              <div
                key={video.url}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px minmax(180px, 1fr) minmax(260px, 1.4fr) auto',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  background: '#fff',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                }}
              >
                <span style={{ color: '#999', textAlign: 'center' }}>#{index + 1}</span>
                <input
                  type="text"
                  value={video.title}
                  onChange={event => updateTitle(index, event.target.value)}
                  aria-label={`视频 ${index + 1} 标题`}
                  style={{
                    width: '100%',
                    minWidth: 0,
                    padding: '8px 10px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                  }}
                />
                <a
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#666',
                    fontSize: '13px',
                  }}
                >
                  {video.url}
                </a>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => moveVideo(index, -1)}
                    disabled={index === 0}
                  >
                    上移
                  </button>
                  <button
                    type="button"
                    onClick={() => moveVideo(index, 1)}
                    disabled={index === videos.length - 1}
                  >
                    下移
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    style={{ color: '#cf1322' }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
