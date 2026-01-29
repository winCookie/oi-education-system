import { generateAvatar } from '../utils/avatarGenerator';

interface AvatarProps {
  username: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ username, avatarUrl, size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const pixelSize = {
    sm: 32,
    md: 40,
    lg: 64,
    xl: 96,
  };

  const src = avatarUrl || generateAvatar(username, pixelSize[size]);

  return (
    <img
      src={src}
      alt={username}
      className={`${sizeMap[size]} rounded-full object-cover ${className}`}
    />
  );
};
