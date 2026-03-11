'use client';

import { useState, useEffect, useRef } from 'react';

// 管理页面密码（可以改为更复杂的密码）
const ADMIN_PASSWORD = 'gu123456';

interface PhotoInfo {
  title: string;
  desc: string;
}

interface Album {
  name: string;
  title: string;
  subtitle: string;
  cover: string;
  photos: string[];
  photoInfos: Record<string, PhotoInfo>;
}

interface HomePhoto {
  filename: string;
  src: string;
  info: PhotoInfo;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [homePhotos, setHomePhotos] = useState<HomePhoto[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [activeTab, setActiveTab] = useState<'albums' | 'home'>('albums');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // 新建影集表单
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumSubtitle, setNewAlbumSubtitle] = useState('');

  // 编辑状态
  const [editingInfo, setEditingInfo] = useState<{ title: string; subtitle: string }>({
    title: '',
    subtitle: '',
  });
  const [editingPhotoInfos, setEditingPhotoInfos] = useState<Record<string, PhotoInfo>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const homePhotoInputRef = useRef<HTMLInputElement>(null);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [albumsRes, homeRes] = await Promise.all([
        fetch('/api/albums'),
        fetch('/api/home-photos'),
      ]);
      const albumsData = await albumsRes.json();
      const homeData = await homeRes.json();
      setAlbums(albumsData);
      setHomePhotos(Array.isArray(homeData) ? homeData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setIsLoading(false);
  }

  // 创建新影集
  async function handleCreateAlbum() {
    if (!newAlbumName.trim()) {
      alert('请输入影集名称');
      return;
    }

    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAlbumName.trim(),
          title: newAlbumTitle.trim() || newAlbumName.trim(),
          subtitle: newAlbumSubtitle.trim(),
        }),
      });

      if (res.ok) {
        await loadData();
        setIsCreating(false);
        setNewAlbumName('');
        setNewAlbumTitle('');
        setNewAlbumSubtitle('');
        alert('影集创建成功！');
      } else {
        const data = await res.json();
        alert(data.error || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create album:', error);
      alert('创建失败');
    }
  }

  // 选择影集进行编辑
  async function handleSelectAlbum(album: Album) {
    setSelectedAlbum(album);
    setEditingInfo({ title: album.title, subtitle: album.subtitle });
    setEditingPhotoInfos(album.photoInfos || {});
    setHasChanges(false);
  }

  // 保存影集信息
  async function handleSaveAlbum() {
    if (!selectedAlbum) return;

    try {
      const res = await fetch(`/api/albums/${selectedAlbum.name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingInfo.title,
          subtitle: editingInfo.subtitle,
          photoInfos: editingPhotoInfos,
        }),
      });

      if (res.ok) {
        await loadData();
        // 更新当前选中的影集
        const updated = albums.find(a => a.name === selectedAlbum.name);
        if (updated) setSelectedAlbum(updated);
        setHasChanges(false);
        alert('保存成功！');
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('Failed to save album:', error);
      alert('保存失败');
    }
  }

  // 上传照片
  async function handleUploadPhotos(files: FileList) {
    if (!selectedAlbum) return;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        await fetch(`/api/albums/${selectedAlbum.name}/upload`, {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        console.error('Failed to upload:', error);
      }
    }

    await loadData();
    // 刷新选中的影集
    const res = await fetch(`/api/albums/${selectedAlbum.name}`);
    const updated = await res.json();
    setSelectedAlbum(updated);
  }

  // 上传封面
  async function handleUploadCover(file: File) {
    if (!selectedAlbum) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'cover');

    try {
      await fetch(`/api/albums/${selectedAlbum.name}/upload`, {
        method: 'POST',
        body: formData,
      });
      await loadData();
      const res = await fetch(`/api/albums/${selectedAlbum.name}`);
      const updated = await res.json();
      setSelectedAlbum(updated);
    } catch (error) {
      console.error('Failed to upload cover:', error);
    }
  }

  // 删除照片
  async function handleDeletePhoto(filename: string) {
    if (!selectedAlbum) return;
    if (!confirm(`确定要删除 ${filename} 吗？`)) return;

    try {
      await fetch(`/api/albums/${selectedAlbum.name}/upload?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      await loadData();
      const res = await fetch(`/api/albums/${selectedAlbum.name}`);
      const updated = await res.json();
      setSelectedAlbum(updated);
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  }

  // 删除影集
  async function handleDeleteAlbum(name: string) {
    if (!confirm(`确定要删除影集 "${name}" 吗？此操作不可恢复！`)) return;

    try {
      const res = await fetch(`/api/albums/${name}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
        if (selectedAlbum?.name === name) {
          setSelectedAlbum(null);
        }
        alert('影集已删除');
      }
    } catch (error) {
      console.error('Failed to delete album:', error);
      alert('删除失败');
    }
  }

  // 更新照片信息
  function handlePhotoInfoChange(filename: string, field: 'title' | 'desc', value: string) {
    const key = filename.replace(/\.[^/.]+$/, '');
    setEditingPhotoInfos(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
    setHasChanges(true);
  }

  // 首页照片操作
  async function handleUploadHomePhotos(files: FileList) {
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        await fetch('/api/home-photos/upload', {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        console.error('Failed to upload:', error);
      }
    }
    await loadData();
  }

  async function handleDeleteHomePhoto(filename: string) {
    if (!confirm(`确定要删除这张照片吗？`)) return;

    try {
      await fetch(`/api/home-photos/upload?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      await loadData();
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  }

  async function handleSaveHomePhotos() {
    const photoInfos: Record<string, PhotoInfo> = {};
    homePhotos.forEach(photo => {
      const key = photo.filename.replace(/\.[^/.]+$/, '');
      photoInfos[key] = photo.info;
    });

    try {
      const res = await fetch('/api/home-photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoInfos }),
      });

      if (res.ok) {
        alert('保存成功！');
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }

  function handleHomePhotoInfoChange(filename: string, field: 'title' | 'desc', value: string) {
    setHomePhotos(prev =>
      prev.map(photo =>
        photo.filename === filename
          ? { ...photo, info: { ...photo.info, [field]: value } }
          : photo
      )
    );
  }

  // 未登录显示密码输入
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
      {/* 标签页切换 */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('albums')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            border: 'none',
            background: activeTab === 'albums' ? '#0070f3' : '#f5f5f5',
            color: activeTab === 'albums' ? '#fff' : '#333',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
          }}
        >
          影集管理
        </button>
        <button
          onClick={() => setActiveTab('home')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'home' ? '#0070f3' : '#f5f5f5',
            color: activeTab === 'home' ? '#fff' : '#333',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
          }}
        >
          首页精选 ({homePhotos.length})
        </button>
      </div>

      {/* 影集管理 */}
      {activeTab === 'albums' && (
        <div>
          {/* 影集列表 */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* 左侧：影集列表 */}
            <div style={{ width: '300px', flexShrink: 0 }}>
              <div style={{ marginBottom: '15px' }}>
                <button
                  onClick={() => setIsCreating(true)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#0070f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  + 新建影集
                </button>
              </div>

              {/* 创建新影集表单 */}
              {isCreating && (
                <div
                  style={{
                    padding: '15px',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                    marginBottom: '15px',
                  }}
                >
                  <h3 style={{ marginBottom: '15px' }}>新建影集</h3>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>名称（英文/拼音）*</label>
                    <input
                      type="text"
                      value={newAlbumName}
                      onChange={e => setNewAlbumName(e.target.value)}
                      placeholder="如: my-album"
                      style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>标题（中文）</label>
                    <input
                      type="text"
                      value={newAlbumTitle}
                      onChange={e => setNewAlbumTitle(e.target.value)}
                      placeholder="如: 我的影集"
                      style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>副标题</label>
                    <input
                      type="text"
                      value={newAlbumSubtitle}
                      onChange={e => setNewAlbumSubtitle(e.target.value)}
                      placeholder="如: 2024年摄影作品"
                      style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleCreateAlbum}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#0070f3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      创建
                    </button>
                    <button
                      onClick={() => setIsCreating(false)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#ddd',
                        color: '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {/* 影集列表 */}
              <div>
                {albums.map(album => (
                  <div
                    key={album.name}
                    onClick={() => handleSelectAlbum(album)}
                    style={{
                      padding: '12px',
                      marginBottom: '10px',
                      background: selectedAlbum?.name === album.name ? '#e8f4ff' : '#fff',
                      border: selectedAlbum?.name === album.name ? '2px solid #0070f3' : '1px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{album.title}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {album.photos.length} 张照片
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧：影集编辑 */}
            <div style={{ flex: 1 }}>
              {selectedAlbum ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>编辑: {selectedAlbum.title}</h2>
                    <button
                      onClick={() => handleDeleteAlbum(selectedAlbum.name)}
                      style={{
                        padding: '8px 16px',
                        background: '#ff4d4f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      删除影集
                    </button>
                  </div>

                  {/* 影集基本信息 */}
                  <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '15px' }}>基本信息</h3>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px' }}>标题</label>
                      <input
                        type="text"
                        value={editingInfo?.title || ''}
                        onChange={e => {
                          setEditingInfo({ ...editingInfo, title: e.target.value });
                          setHasChanges(true);
                        }}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px' }}>副标题</label>
                      <input
                        type="text"
                        value={editingInfo?.subtitle || ''}
                        onChange={e => {
                          setEditingInfo({ ...editingInfo, subtitle: e.target.value });
                          setHasChanges(true);
                        }}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>封面图片</label>
                      {selectedAlbum.cover && (
                        <img
                          src={`/photos/${selectedAlbum.name}/${selectedAlbum.cover}`}
                          alt="封面"
                          style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }}
                        />
                      )}
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={e => e.target.files?.[0] && handleUploadCover(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        style={{
                          padding: '8px 16px',
                          background: '#fff',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        更换封面
                      </button>
                    </div>
                  </div>

                  {/* 上传照片 */}
                  <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '15px' }}>上传照片</h3>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => e.target.files && handleUploadPhotos(e.target.files)}
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '10px 20px',
                        background: '#0070f3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      + 添加照片
                    </button>
                  </div>

                  {/* 照片列表 */}
                  <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3>照片列表 ({selectedAlbum.photos.length})</h3>
                      {hasChanges && (
                        <button
                          onClick={handleSaveAlbum}
                          style={{
                            padding: '8px 16px',
                            background: '#52c41a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          保存修改
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                      {selectedAlbum.photos.map(photo => {
                        const key = photo.replace(/\.[^/.]+$/, '');
                        const info = editingPhotoInfos[key] || { title: '', desc: '' };
                        return (
                          <div
                            key={photo}
                            style={{
                              background: '#fff',
                              padding: '10px',
                              borderRadius: '8px',
                              border: '1px solid #eee',
                            }}
                          >
                            <img
                              src={`/photos/${selectedAlbum.name}/${photo}`}
                              alt={photo}
                              style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <div style={{ marginTop: '8px' }}>
                              <input
                                type="text"
                                placeholder="标题"
                                value={info.title}
                                onChange={e => handlePhotoInfoChange(photo, 'title', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '6px',
                                  marginBottom: '5px',
                                  boxSizing: 'border-box',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                }}
                              />
                              <textarea
                                placeholder="描述"
                                value={info.desc}
                                onChange={e => handlePhotoInfoChange(photo, 'desc', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '6px',
                                  boxSizing: 'border-box',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  resize: 'vertical',
                                  minHeight: '50px',
                                }}
                              />
                            </div>
                            <button
                              onClick={() => handleDeletePhoto(photo)}
                              style={{
                                width: '100%',
                                marginTop: '8px',
                                padding: '6px',
                                background: '#ff4d4f',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              删除
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                  <p>选择一个影集进行编辑</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 首页精选管理 */}
      {activeTab === 'home' && (
        <div>
          <h2>首页精选照片管理</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            这些照片会显示在首页，与影集照片一起展示
          </p>

          {/* 上传照片 */}
          <div style={{ marginBottom: '20px' }}>
            <input
              ref={homePhotoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={e => e.target.files && handleUploadHomePhotos(e.target.files)}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => homePhotoInputRef.current?.click()}
              style={{
                padding: '10px 20px',
                background: '#0070f3',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              + 添加照片
            </button>
            <button
              onClick={handleSaveHomePhotos}
              style={{
                marginLeft: '10px',
                padding: '10px 20px',
                background: '#52c41a',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              保存所有修改
            </button>
          </div>

          {/* 照片列表 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {homePhotos.map(photo => (
              <div
                key={photo.filename}
                style={{
                  background: '#fff',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #eee',
                }}
              >
                <img
                  src={photo.src}
                  alt={photo.filename}
                  style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="标题"
                    value={photo.info?.title || ''}
                    onChange={e => handleHomePhotoInfoChange(photo.filename, 'title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '8px',
                      boxSizing: 'border-box',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                  <textarea
                    placeholder="描述"
                    value={photo.info?.desc || ''}
                    onChange={e => handleHomePhotoInfoChange(photo.filename, 'desc', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      boxSizing: 'border-box',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      resize: 'vertical',
                      minHeight: '60px',
                    }}
                  />
                </div>
                <button
                  onClick={() => handleDeleteHomePhoto(photo.filename)}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '8px',
                    background: '#ff4d4f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  删除
                </button>
              </div>
            ))}
          </div>

          {homePhotos.length === 0 && (
            <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
              <p>暂无照片，点击上方按钮添加</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
