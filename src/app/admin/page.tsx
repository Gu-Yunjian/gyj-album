'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ExifInfo {
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  dateTaken?: string;
  camera?: string;
}

interface PhotoInfo {
  title: string;
  desc: string;
  exif?: ExifInfo;
}

interface Photo {
  filename: string;
  originalName: string;
  mainSize: number;
  thumbSize: number;
  exif?: ExifInfo;
}

interface Album {
  name: string;
  title: string;
  subtitle: string;
  cover: string;
  photos: string[];
  photoInfos: Record<string, PhotoInfo>;
  hasBgm: boolean;
  order?: number;
}

interface AlbumsData {
  albums: Album[];
  allPhotos: Record<string, Photo>;
}

const ADMIN_PASSWORD = 'gu123456';

// 操作日志组件
function LogPanel({ logs, onClear }: { logs: string[], onClear: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '300px',
      background: '#1a1a1a',
      color: '#00ff00',
      borderRadius: '8px',
      padding: '12px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px',
        borderBottom: '1px solid #333',
        paddingBottom: '8px'
      }}>
        <span>🖥️ 操作日志</span>
        <button 
          onClick={onClear}
          style={{
            background: 'transparent',
            border: '1px solid #666',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          清空
        </button>
      </div>
      <div 
        ref={scrollRef}
        style={{ 
          overflowY: 'auto', 
          maxHeight: '240px',
          lineHeight: '1.6'
        }}
      >
        {logs.map((log, i) => (
          <div key={i} style={{ 
            color: log.startsWith('❌') ? '#ff6666' : 
                   log.startsWith('✅') ? '#66ff66' : 
                   log.startsWith('⏳') ? '#ffaa00' : '#00ff00'
          }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [albumsData, setAlbumsData] = useState<AlbumsData>({ albums: [], allPhotos: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumSubtitle, setNewAlbumSubtitle] = useState('');

  // About 页面编辑
  const [activeTab, setActiveTab] = useState<'albums' | 'about'>('albums');
  const [aboutContent, setAboutContent] = useState('');
  const [aboutLoading, setAboutLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 添加日志
  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-50), `[${time}] ${msg}`]);
  }, []);

  // 登录
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  }

  // 加载数据
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/albums.json');
      if (response.ok) {
        const data = await response.json();
        const albumsWithOrder = data.albums.map((album: Album, index: number) => ({
          ...album,
          order: album.order ?? index
        }));
        setAlbumsData({ ...data, albums: albumsWithOrder });
      }
    } catch (error) {
      console.error('Failed to load albums:', error);
      addLog('❌ 加载数据失败');
    }
    setIsLoading(false);
  }, [addLog]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // 加载 About 页面内容
  const loadAboutContent = useCallback(async () => {
    setAboutLoading(true);
    try {
      const response = await fetch('/api/admin/about');
      if (response.ok) {
        const data = await response.json();
        setAboutContent(data.content || '');
      }
    } catch (error) {
      console.error('加载 About 失败:', error);
      addLog('❌ 加载 About 页面失败');
    }
    setAboutLoading(false);
  }, [addLog]);

  // 保存 About 页面内容
  const saveAboutContent = async () => {
    addLog('⏳ 保存 About 页面...');
    try {
      const response = await fetch('/api/admin/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: aboutContent })
      });

      if (response.ok) {
        addLog('✅ About 页面已保存');
        setMessage('✅ About 页面已保存！记得 git push 部署');
      } else {
        throw new Error('保存失败');
      }
    } catch (error: any) {
      addLog(`❌ 保存失败: ${error.message}`);
      setMessage('❌ 保存失败');
    }
  };

  // 切换标签页时加载 About 内容
  useEffect(() => {
    if (activeTab === 'about' && !aboutContent) {
      loadAboutContent();
    }
  }, [activeTab, aboutContent, loadAboutContent]);

  // 更新影集信息
  function updateAlbumInfo(albumName: string, field: 'title' | 'subtitle', value: string) {
    setAlbumsData(prev => ({
      ...prev,
      albums: prev.albums.map(album =>
        album.name === albumName
          ? { ...album, [field]: value }
          : album
      )
    }));
    // 同时更新 selectedAlbum 状态
    if (selectedAlbum?.name === albumName) {
      setSelectedAlbum(prev => prev ? { ...prev, [field]: value } : null);
    }
  }

  // 更新照片信息
  function updatePhotoInfo(albumName: string, photoStem: string, field: 'title' | 'desc', value: string) {
    setAlbumsData(prev => ({
      ...prev,
      albums: prev.albums.map(album =>
        album.name === albumName
          ? {
              ...album,
              photoInfos: {
                ...album.photoInfos,
                [photoStem]: {
                  ...album.photoInfos[photoStem],
                  [field]: value
                }
              }
            }
          : album
      )
    }));
    // 同时更新 selectedAlbum 状态
    if (selectedAlbum?.name === albumName) {
      setSelectedAlbum(prev => prev ? {
        ...prev,
        photoInfos: {
          ...prev.photoInfos,
          [photoStem]: {
            ...prev.photoInfos[photoStem],
            [field]: value
          }
        }
      } : null);
    }
  }

  // 获取照片信息
  function getPhotoInfo(album: Album, photoFilename: string): PhotoInfo {
    const stem = photoFilename.replace(/\.[^/.]+$/, '');
    return album.photoInfos[stem] || { title: '', desc: '' };
  }

  // 移动影集排序
  function moveAlbum(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === albumsData.albums.length - 1) return;

    const newAlbums = [...albumsData.albums];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newAlbums[index], newAlbums[targetIndex]] = [newAlbums[targetIndex], newAlbums[index]];
    
    const updatedAlbums = newAlbums.map((album, i) => ({ ...album, order: i }));
    
    setAlbumsData(prev => ({ ...prev, albums: updatedAlbums }));
    setMessage('✅ 影集排序已调整，记得保存！');
  }

  // 创建新影集
  async function handleCreateAlbum() {
    if (!newAlbumName.trim()) {
      alert('请输入影集名称');
      return;
    }

    if (albumsData.albums.some(a => a.name === newAlbumName.trim())) {
      alert('影集名称已存在');
      return;
    }

    addLog(`⏳ 创建影集: ${newAlbumName}...`);

    // 调用 API 创建目录
    try {
      const albumName = newAlbumName.trim();
      addLog(`  调用 API: /api/admin/files?album=${albumName}`);
      
      const response = await fetch(`/api/admin/files?album=${encodeURIComponent(albumName)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }));
        throw new Error(`API 错误 ${response.status}: ${errorData.error || response.statusText}`);
      }
      
      addLog('  ✅ 目录创建成功');

      const newAlbum: Album = {
        name: newAlbumName.trim(),
        title: newAlbumTitle.trim() || newAlbumName.trim(),
        subtitle: newAlbumSubtitle.trim(),
        cover: '',
        photos: [],
        photoInfos: {},
        hasBgm: false,
        order: albumsData.albums.length
      };

      setAlbumsData(prev => ({
        ...prev,
        albums: [...prev.albums, newAlbum]
      }));

      setIsCreatingAlbum(false);
      setNewAlbumName('');
      setNewAlbumTitle('');
      setNewAlbumSubtitle('');
      addLog('✅ 影集创建成功！');
      setMessage('✅ 影集创建成功！现在可以直接上传照片');
    } catch (error: any) {
      addLog(`❌ 创建影集失败: ${error.message}`);
      console.error('创建影集错误:', error);
      alert(`创建失败: ${error.message}`);
    }
  }

  // 删除影集
  function handleDeleteAlbum(albumName: string) {
    if (!confirm(`确定要删除影集 "${albumName}" 吗？此操作不会删除照片文件。`)) {
      return;
    }

    setAlbumsData(prev => ({
      ...prev,
      albums: prev.albums.filter(a => a.name !== albumName)
    }));

    if (selectedAlbum?.name === albumName) {
      setSelectedAlbum(null);
    }
    setMessage('✅ 影集已删除');
    addLog(`🗑️ 删除影集: ${albumName}`);
  }

  // 上传文件
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, albumName: string) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    addLog(`⏳ 上传 ${files.length} 个文件到 ${albumName}...`);

    try {
      const formData = new FormData();
      formData.append('album', albumName);
      Array.from(files).forEach(file => formData.append('files', file));

      const response = await fetch('/api/admin/files', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('上传失败');

      const result = await response.json();
      addLog(`✅ ${result.message}`);
      
      // 自动运行处理脚本
      addLog('⏳ 自动运行处理脚本...');
      const processResponse = await fetch('/api/admin/process', { method: 'POST' });
      
      if (processResponse.ok) {
        addLog('✅ 图片处理完成');
        setMessage('✅ 上传并处理完成！正在刷新数据...');
        
        // 重新加载数据
        await loadData();
        
        // 刷新选中影集
        if (selectedAlbum?.name === albumName) {
          const updated = albumsData.albums.find(a => a.name === albumName);
          if (updated) setSelectedAlbum(updated);
        }
      } else {
        throw new Error('处理失败');
      }
    } catch (error: any) {
      addLog(`❌ 错误: ${error.message}`);
      setMessage('❌ 操作失败: ' + error.message);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // 删除照片
  async function handleDeletePhoto(albumName: string, filename: string) {
    if (!confirm(`确定要删除 "${filename}" 吗？`)) return;

    addLog(`⏳ 删除 ${filename}...`);

    try {
      const response = await fetch(
        `/api/admin/files?album=${encodeURIComponent(albumName)}&filename=${encodeURIComponent(filename)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('删除失败');

      addLog('✅ 文件已删除');
      
      // 更新本地状态
      setAlbumsData(prev => ({
        ...prev,
        albums: prev.albums.map(album =>
          album.name === albumName
            ? { ...album, photos: album.photos.filter(p => p !== filename) }
            : album
        )
      }));

      // 刷新选中影集
      if (selectedAlbum?.name === albumName) {
        setSelectedAlbum(prev => prev ? {
          ...prev,
          photos: prev.photos.filter(p => p !== filename)
        } : null);
      }

      setMessage('✅ 照片已删除');
    } catch (error: any) {
      addLog(`❌ 删除失败: ${error.message}`);
    }
  }

  // 保存所有修改
  async function handleSave() {
    addLog('⏳ 保存 albums.json...');

    try {
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(albumsData)
      });

      if (!response.ok) throw new Error('保存失败');

      addLog('✅ 已保存到 public/albums.json');
      setMessage('✅ 保存成功！现在可以 git push 部署了');
    } catch (error: any) {
      addLog(`❌ 保存失败: ${error.message}`);
      setMessage('❌ 保存失败');
    }
  }

  // 格式化 EXIF
  function formatExif(exif?: ExifInfo): string {
    if (!exif) return '';
    const parts: string[] = [];
    if (exif.aperture) parts.push(exif.aperture);
    if (exif.shutterSpeed) parts.push(exif.shutterSpeed);
    if (exif.iso) parts.push(`ISO ${exif.iso}`);
    return parts.join(' · ');
  }

  // 格式化文件大小
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
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 日志面板 */}
      <LogPanel logs={logs} onClear={() => setLogs([])} />

      {/* 头部 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0 }}>相册管理系统</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              style={{
                padding: '10px 20px',
                background: '#52c41a',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1
              }}
            >
              💾 保存修改
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              style={{
                padding: '10px 20px',
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

        {/* 标签页切换 */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e8e8e8' }}>
          <button
            onClick={() => setActiveTab('albums')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'albums' ? '#fff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'albums' ? '2px solid #0070f3' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: activeTab === 'albums' ? '600' : '400',
              color: activeTab === 'albums' ? '#0070f3' : '#666'
            }}
          >
            📁 影集管理
          </button>
          <button
            onClick={() => setActiveTab('about')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'about' ? '#fff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'about' ? '2px solid #0070f3' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: activeTab === 'about' ? '600' : '400',
              color: activeTab === 'about' ? '#0070f3' : '#666'
            }}
          >
            📄 About 页面
          </button>
        </div>
      </div>

      {/* 操作提示 */}
      <div style={{
        background: '#f6ffed',
        border: '1px solid #b7eb8f',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 12px 0' }}>🚀 全自动工作流</h3>
        <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '2' }}>
          <li><strong>上传照片</strong>：选择影集 → 点击"上传照片" → 选择文件 → <b>自动处理完成</b></li>
          <li><strong>编辑信息</strong>：填写影集标题、照片标题和描述</li>
          <li><strong>保存部署</strong>：点击"保存修改" → 运行 <code>git push</code></li>
        </ol>
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

      {/* 主内容区 */}
      {activeTab === 'albums' ? (
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 左侧 - 影集列表 */}
        <div style={{ width: '320px', flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h2 style={{ margin: 0 }}>影集列表</h2>
            <button
              onClick={() => setIsCreatingAlbum(true)}
              style={{
                padding: '6px 12px',
                background: '#0070f3',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              + 新建
            </button>
          </div>

          {/* 新建影集表单 */}
          {isCreatingAlbum && (
            <div style={{
              padding: '15px',
              background: '#f9f9f9',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <input
                type="text"
                placeholder="影集名称（英文/拼音）"
                value={newAlbumName}
                onChange={e => setNewAlbumName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <input
                type="text"
                placeholder="影集标题（中文）"
                value={newAlbumTitle}
                onChange={e => setNewAlbumTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <input
                type="text"
                placeholder="副标题（可选）"
                value={newAlbumSubtitle}
                onChange={e => setNewAlbumSubtitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCreateAlbum}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#0070f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  创建
                </button>
                <button
                  onClick={() => setIsCreatingAlbum(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#ddd',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 影集卡片 */}
          {albumsData.albums.map((album, index) => (
            <div
              key={album.name}
              style={{
                padding: '12px',
                marginBottom: '10px',
                background: selectedAlbum?.name === album.name ? '#e8f4ff' : '#fff',
                border: selectedAlbum?.name === album.name ? '2px solid #0070f3' : '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {/* 排序按钮 */}
              <div style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveAlbum(index, 'up');
                  }}
                  disabled={index === 0}
                  style={{
                    padding: '2px 6px',
                    fontSize: '12px',
                    background: index === 0 ? '#f5f5f5' : '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                    opacity: index === 0 ? 0.5 : 1
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveAlbum(index, 'down');
                  }}
                  disabled={index === albumsData.albums.length - 1}
                  style={{
                    padding: '2px 6px',
                    fontSize: '12px',
                    background: index === albumsData.albums.length - 1 ? '#f5f5f5' : '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    cursor: index === albumsData.albums.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: index === albumsData.albums.length - 1 ? 0.5 : 1
                  }}
                >
                  ↓
                </button>
              </div>

              <div onClick={() => setSelectedAlbum(album)}>
                <div style={{ fontWeight: 'bold', paddingRight: '50px' }}>{album.title || album.name}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {album.photos.length} 张照片
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 右侧 - 影集详情 */}
        <div style={{ flex: 1 }}>
          {selectedAlbum ? (
            <div>
              {/* 影集编辑区 */}
              <div style={{ 
                background: '#f9f9f9', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '20px' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h2 style={{ margin: 0 }}>编辑影集</h2>
                  <button
                    onClick={() => handleDeleteAlbum(selectedAlbum.name)}
                    style={{
                      padding: '6px 12px',
                      background: '#ff4d4f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    删除影集
                  </button>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                    影集标题
                  </label>
                  <input
                    type="text"
                    value={selectedAlbum.title}
                    onChange={e => updateAlbumInfo(selectedAlbum.name, 'title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                    副标题
                  </label>
                  <input
                    type="text"
                    value={selectedAlbum.subtitle}
                    onChange={e => updateAlbumInfo(selectedAlbum.name, 'subtitle', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                {/* 上传照片按钮 */}
                <div style={{
                  padding: '20px',
                  background: '#e6f7ff',
                  borderRadius: '6px',
                  border: '2px dashed #91d5ff',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>📸 上传照片</h4>
                  <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#666' }}>
                    选择照片后将自动上传并处理（压缩、生成缩略图、提取EXIF）
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={e => handleFileUpload(e, selectedAlbum.name)}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    style={{
                      padding: '10px 24px',
                      background: isProcessing ? '#ccc' : '#0070f3',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {isProcessing ? '⏳ 处理中...' : '📁 选择照片上传'}
                  </button>
                </div>
              </div>

              {/* 照片列表 */}
              <h3 style={{ marginBottom: '15px' }}>照片列表 ({selectedAlbum.photos.length})</h3>
              {selectedAlbum.photos.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  color: '#999'
                }}>
                  <p>暂无照片</p>
                  <p style={{ fontSize: '14px' }}>点击上方"选择照片上传"按钮添加</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px'
                }}>
                  {selectedAlbum.photos.map(photoFilename => {
                    const stem = photoFilename.replace(/\.[^/.]+$/, '');
                    const photoInfo = getPhotoInfo(selectedAlbum, photoFilename);
                    const fullKey = `${selectedAlbum.name}/${stem}`;
                    const photoData = albumsData.allPhotos[fullKey];
                    
                    return (
                      <div
                        key={photoFilename}
                        style={{
                          background: '#fff',
                          border: '1px solid #e8e8e8',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                      >
                        {/* 缩略图 */}
                        <div style={{ 
                          position: 'relative', 
                          paddingTop: '66.67%', 
                          background: '#f5f5f5' 
                        }}>
                          <img
                            src={`/thumbnails/${selectedAlbum.name}/${photoFilename.replace(/\.[^/.]+$/, '')}.webp`}
                            alt={photoFilename}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          {/* 删除按钮 */}
                          <button
                            onClick={() => handleDeletePhoto(selectedAlbum.name, photoFilename)}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              width: '28px',
                              height: '28px',
                              background: 'rgba(255,77,79,0.9)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              fontSize: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="删除"
                          >
                            ×
                          </button>
                        </div>

                        {/* 信息编辑 */}
                        <div style={{ padding: '12px' }}>
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#999', 
                            marginBottom: '8px',
                            wordBreak: 'break-all'
                          }}>
                            {photoFilename}
                            {photoData?.mainSize && (
                              <span style={{ marginLeft: '8px' }}>
                                ({formatSize(photoData.mainSize)})
                              </span>
                            )}
                          </div>
                          
                          {/* EXIF 信息 */}
                          {photoData?.exif && formatExif(photoData.exif) && (
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#666',
                              fontFamily: 'monospace',
                              marginBottom: '8px',
                              background: '#f5f5f5',
                              padding: '4px 8px',
                              borderRadius: '4px'
                            }}>
                              {formatExif(photoData.exif)}
                            </div>
                          )}

                          <input
                            type="text"
                            placeholder="照片标题"
                            value={photoInfo.title}
                            onChange={e => updatePhotoInfo(selectedAlbum.name, stem, 'title', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px',
                              marginBottom: '6px',
                              border: '1px solid #d9d9d9',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          />
                          <textarea
                            placeholder="照片描述"
                            value={photoInfo.desc}
                            onChange={e => updatePhotoInfo(selectedAlbum.name, stem, 'desc', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px',
                              border: '1px solid #d9d9d9',
                              borderRadius: '4px',
                              fontSize: '14px',
                              resize: 'vertical',
                              minHeight: '50px'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px', 
              color: '#999',
              background: '#f9f9f9',
              borderRadius: '8px'
            }}>
              <p>从左侧选择一个影集进行编辑</p>
            </div>
          )}
        </div>
      </div>
      ) : (
        /* About 页面编辑区 */
        <div>
          <div style={{
            background: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0' }}>编辑 About 页面</h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                  支持 Markdown 语法，支持 YAML frontmatter 定义个人信息
                </p>
              </div>
              <button
                onClick={saveAboutContent}
                disabled={aboutLoading}
                style={{
                  padding: '10px 20px',
                  background: aboutLoading ? '#ccc' : '#52c41a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: aboutLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {aboutLoading ? '保存中...' : '💾 保存'}
              </button>
            </div>

            {aboutLoading && !aboutContent ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                加载中...
              </div>
            ) : (
              <div>
                <textarea
                  value={aboutContent}
                  onChange={e => setAboutContent(e.target.value)}
                  placeholder="在此编辑 about.md 内容..."
                  style={{
                    width: '100%',
                    minHeight: '500px',
                    padding: '12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    fontFamily: 'Monaco, Menlo, Consolas, monospace',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    resize: 'vertical'
                  }}
                />
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                  <strong>提示：</strong>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>顶部可用 <code>---</code> 包裹 YAML frontmatter 定义个人信息（如 name, school, slogan）</li>
                    <li>支持标准 Markdown 语法：<code>## 标题</code>、<code>**粗体**</code>、<code>*斜体*</code>、<code>- 列表</code> 等</li>
                    <li>保存后记得 git push 部署</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
