import type { ReactNode } from 'react';
import FlowerCornerTasks from '@/components/FlowerCornerTasks';

export default function FlowerCornerLayout({ children }: { children: ReactNode }) {
  return <>{children}<FlowerCornerTasks /></>;
}
