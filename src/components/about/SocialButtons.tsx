'use client';

import { useState, useCallback } from 'react';
import styles from './SocialButtons.module.css';

interface SocialButton {
  id: string;
  name: string;
  type: 'link' | 'copy';
  value: string;
  icon: string;
  color: string;
}

interface SocialButtonsProps {
  buttons: SocialButton[];
}

// 小红书图标
const XiaohongshuIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.36c-.26.43-.7.7-1.19.73-.5.03-.97-.18-1.28-.55l-2.17-2.72-2.17 2.72c-.31.37-.78.58-1.28.55-.49-.03-.93-.3-1.19-.73-.46-.73-.24-1.7.49-2.16l2.83-1.77-2.83-1.77c-.73-.46-.95-1.43-.49-2.16.26-.43.7-.7 1.19-.73.5-.03.97.18 1.28.55l2.17 2.72 2.17-2.72c.31-.37.78-.58 1.28-.55.49.03.93.3 1.19.73.46.73.24 1.7-.49 2.16l-2.83 1.77 2.83 1.77c.73.46.95 1.43.49 2.16z"/>
  </svg>
);

// 哔哩哔哩图标
const BilibiliIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.396.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.497.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.397-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
  </svg>
);

// 邮箱图标
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5z"/>
  </svg>
);

// 微信图标
const WechatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
  </svg>
);

// QQ图标
const QQIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29.43 2.21 0 6.287.257 6.287-.43 0-.687-1.768-1.182-1.768-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.746 2.072.111 0 .283-.36.283-1.025 0-2.514-2.166-6.954-2.166-6.954V9.325C18.29 3.364 14.268 2 12.003 2z"/>
  </svg>
);

const IconMap: Record<string, React.FC> = {
  xiaohongshu: XiaohongshuIcon,
  bilibili: BilibiliIcon,
  email: EmailIcon,
  wechat: WechatIcon,
  qq: QQIcon,
};

const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

function isSafeLink(value: string): boolean {
  try {
    const url = new URL(value);
    return ALLOWED_LINK_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

export default function SocialButtons({ buttons }: SocialButtonsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleClick = useCallback(async (button: SocialButton) => {
    if (button.type === 'link') {
      if (!isSafeLink(button.value)) {
        console.warn('Blocked unsafe social link:', button.value);
        return;
      }
      window.open(button.value, '_blank', 'noopener,noreferrer');
    } else {
      try {
        await navigator.clipboard.writeText(button.value);
        setCopiedId(button.id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }, []);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>联系方式</h3>
      <div className={styles.buttons}>
        {buttons.map((button) => {
          const IconComponent = IconMap[button.icon] || EmailIcon;
          return (
            <button
              key={button.id}
              className={styles.button}
              onClick={() => handleClick(button)}
              style={{ '--button-color': button.color } as React.CSSProperties}
              title={button.name}
            >
              <span className={styles.icon}>
                <IconComponent />
              </span>
              <span className={styles.name}>{button.name}</span>
              {copiedId === button.id && (
                <span className={styles.toast}>已复制</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
