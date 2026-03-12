'use client';

import { useState, useEffect } from 'react';

interface PhotoMetadata {
  filename: string;
  originalName: string;
  mainSize: number;
  thumbSize: number;
  exif: {
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    dateTaken?: string;
    camera?: string;
  };
  title?: string;
  desc?: string;
}

const ADMIN_PASSWORD = 'gu123456';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [photos, setPhotos] = useState<Record<string, PhotoMetadata>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 登录验证
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  }

  // 加载照片数据
  useEffect(() => {
    if (isAuthenticated) {
      loadPhotos();
    }
  }, [isAuthenticated]);

  async function loadPhotos() {
    setIsLoading(true);
    try {
      const response = await fetch('/photos.json');
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      }
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
    setIsLoading(false);
  }

  // 更新照片信息
  function updatePhotoInfo(stem: string, field: 'title' | 'desc', value: string) {
    setPhotos(prev => ({
      ...prev,
      [stem]: {
        ...prev[stem],
        [field]: value,
      },
    }));
  }

  // 保存修改（生成下载文件，用户手动放入项目）
  async function handleSave() {
    setIsSaving(true);
    try {
      // 由于静态导出无法直接写文件，提供下载
      const dataStr = JSON.stringify(photos, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'photos.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMessage('✅ 已下载 photos.json，请将其复制到 public/ 目录并提交');
    } catch (error) {
      setMessage('❌ 保存失败');
    }
    setIsSaving(false);
  }

  // 显示图片大小
  function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <form onSubmit={handleLogin} style={{
          background: '#fff',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '20px' }}>管理页面登录</h2>
          <input
            type="password"
            value={passwordInput}
            onChange={e => {
              setPasswordInput(e.target.value);
              setPasswordError(false);
            }}
            placeholder="请输入管理密码"
            style={{
              width: '250px',
              padding: '12px',
              fontSize: '16px',
              border: passwordError ? '2px solid #ff4d4f' : '1px solid #ddd',
              borderRadius: '6px',
              marginBottom: '10px'
            }}
          />
          {passwordError && (
            <p style={{ color: '#ff4d4f', marginBottom: '15px' }}>密码错误，请重试</p>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              background: '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            登录
          </button>
        </form>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>相册管理系统</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => window.open('/DEPLOY.md', '_blank')}
            style={{
              padding: '8px 16px',
              background: '#52c41a',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            查看部署指南
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            style={{
              padding: '8px 16px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            退出登录
          </button>
        </div>
      </div>

      {/* 工作流提示 */}
      <div style={{
        background: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 12px 0' }}>📋 照片管理工作流</h3>
        <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
          <li><strong>添加原图</strong>：将照片复制到项目根目录的 <code>originals/</code> 文件夹</li>
          <li><strong>处理图片</strong>：运行命令 <code>python scripts/process_photos.py</code></li>
          <li><strong>编辑信息</strong>：在本页下方编辑照片标题和描述</li>
          <li><strong>保存提交</strong>：点击"保存修改"下载 photos.json，复制到 public/ 目录</li>
          <li><strong>部署</strong>：运行 <code>scripts\deploy.bat</code> 或手动 git push</li>
        </ol>
      </div>

      {/* 统计信息 */}
      <div style={{
        background: '#f6ffed',
        border: '1px solid #b7eb8f',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <strong>📊 统计：</strong>共 {Object.keys(photos).length} 张照片
      </div>

      {message && (
        <div style={{
          background: message.startsWith('✅') ? '#f6ffed' : '#fff2f0',
          border: `1px solid ${message.startsWith('✅') ? '#b7eb8f' : '#ffccc7'}`,
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}

      {/* 保存按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '10px 24px',
            background: isSaving ? '#ccc' : '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {isSaving ? '保存中...' : '💾 保存修改'}
        </button>
        <button
          onClick={loadPhotos}
          style={{
            marginLeft: '10px',
            padding: '10px 24px',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 刷新数据
        </button>
      </div>

      {/* 照片列表 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {Object.entries(photos).map(([stem, photo]) => (
          <div
            key={stem}
            style={{
              background: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            {/* 缩略图 */}
            <div style={{ position: 'relative', paddingTop: '66.67%', background: '#f5f5f5' }}>
              <img
                src={`/thumbnails/${photo.filename}`}
                alt={stem}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `/photos/${photo.filename}`;
                }}
              />
            </div>

            {/* 信息编辑 */}
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                <code>{photo.originalName}</code>
              </div>
              
              {/* EXIF 信息展示 */}
              {photo.exif && (photo.exif.aperture || photo.exif.shutterSpeed || photo.exif.iso) && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#888', 
                  marginBottom: '12px',
                  fontFamily: 'monospace'
                }}>
                  {[photo.exif.aperture, photo.exif.shutterSpeed, photo.exif.iso ? `ISO ${photo.exif.iso}` : '']
                    .filter(Boolean)
                    .join(' · ')}
                  {photo.exif.camera && (
                    <div style={{ marginTop: '4px' }}>📷 {photo.exif.camera}</div>
                  )}
                </div>
              )}

              {/* 文件大小 */}
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                主图: {formatSize(photo.mainSize)} | 缩略图: {formatSize(photo.thumbSize)}
              </div>

              {/* 标题输入 */}
              <input
                type="text"
                placeholder="照片标题"
                value={photo.title || ''}
                onChange={e => updatePhotoInfo(stem, 'title', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />

              {/* 描述输入 */}
              <textarea
                placeholder="照片描述"
                value={photo.desc || ''}
                onChange={e => updatePhotoInfo(stem, 'desc', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '60px'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {Object.keys(photos).length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
          <p>暂无照片</p>
          <p style={{ fontSize: '14px' }}>请先将照片放入 originals/ 目录，然后运行处理脚本</p>
        </div>
      )}
    </div>
  );
}
