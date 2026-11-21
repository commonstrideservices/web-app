'use client'

import { useRouter } from 'next/navigation'
import { NativeSelect } from '@/components/ui/native-select'

export function PageSizeSelect({ size, options }: { size: number; options: { size: number; href: string }[] }) {
  const router = useRouter()
  return <label className="flex items-center gap-2 whitespace-nowrap">
    Rows per page
    <NativeSelect className="w-auto" value={size} onChange={(event) => {
      const option = options.find(({ size }) => String(size) === event.target.value)
      if (option) router.push(option.href)
    }}>
      {options.map(({ size }) => <option key={size}>{size}</option>)}
    </NativeSelect>
  </label>
}
