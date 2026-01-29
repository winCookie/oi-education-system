// 基于用户名生成几何图形SVG头像
export function generateAvatar(username: string, size: number = 80): string {
  // 简单的哈希函数
  const hash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const hashValue = hash(username);
  
  // 生成颜色
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  ];
  const bgColor = colors[hashValue % colors.length];
  
  // 生成形状（圆形、方形、三角形）
  const shapes = ['circle', 'square', 'triangle'];
  const shapeType = shapes[Math.floor(hashValue / 10) % shapes.length];
  
  // 使用用户名首字符
  const initial = username.charAt(0).toUpperCase();
  
  let shapeElement = '';
  
  if (shapeType === 'circle') {
    shapeElement = `<circle cx="40" cy="40" r="30" fill="white" opacity="0.2"/>`;
  } else if (shapeType === 'square') {
    shapeElement = `<rect x="20" y="20" width="40" height="40" fill="white" opacity="0.2"/>`;
  } else {
    shapeElement = `<polygon points="40,15 65,55 15,55" fill="white" opacity="0.2"/>`;
  }
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${bgColor}"/>
      ${shapeElement}
      <text x="50%" y="50%" font-size="32" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${initial}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
