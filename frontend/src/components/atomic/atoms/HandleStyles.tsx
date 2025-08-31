'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';

type HandleType = 'source' | 'target';

const color = {
  bg: '!bg-green-600',
  hoverBg: 'hover:!bg-green-700',
  shadow: 'drop-shadow(0 0 8px rgba(34,197,94,.3))',
};

const baseCls = '!w-4 !h-4 !border-2 !border-white pointer-events-auto';
const cls = `${baseCls} ${color.bg} ${color.hoverBg}`;
const styleBase: React.CSSProperties = { filter: color.shadow, zIndex: 10 };

// 🔴 추가: source와 target 핸들을 구분하는 스타일
const sourceStyle: React.CSSProperties = { 
  ...styleBase, 
  background: '#3b82f6', // 파란색 (source)
  border: '2px solid white'
};
const targetStyle: React.CSSProperties = { 
  ...styleBase, 
  background: '#10b981', // 초록색 (target)
  border: '2px solid white'
};

/**
 * 각 방향에 source 핸들 하나씩만 배치 (4방향 연결 가능)
 * React Flow가 연결 시 자동으로 target으로 인식
 * - Left: source
 * - Right: source
 * - Top: source
 * - Bottom: source
 */
export const renderFourDirectionHandles = (isConnectable = true) => {
  const handles = [
    {
      position: Position.Left,
      type: 'source' as HandleType,
      id: 'left',
    },
    {
      position: Position.Right,
      type: 'source' as HandleType,
      id: 'right',
    },
    {
      position: Position.Top,
      type: 'source' as HandleType,
      id: 'top',
    },
    {
      position: Position.Bottom,
      type: 'source' as HandleType,
      id: 'bottom',
    },
  ];

  return handles.map(({ position, type, id }) => (
    <Handle
      key={id}
      id={id}
      type={type}
      position={position}
      isConnectable={isConnectable}
      className={cls}
      style={sourceStyle}
    />
  ));
};

/* 그룹 노드 등에서 쓸 기본 핸들 스타일 */
export const handleStyle = {
  background: '#3b82f6',
  width: 12,
  height: 12,
  border: '2px solid white',
  borderRadius: '50%',
};
