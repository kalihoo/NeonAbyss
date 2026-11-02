import { useEffect, useState } from 'react'
import type { UploadedFish } from './scene/customFishStorage'

type FishUploadControlsProps = {
  customFish: UploadedFish[]
  uploadStatus: string
  onUploadFiles: (files: File[]) => void
  onRemoveCustomFish: (id: string) => void
}

export function FishUploadControls({ customFish, uploadStatus, onUploadFiles, onRemoveCustomFish }: FishUploadControlsProps) {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    const urls: Record<string, string> = {}
    for (const item of customFish) urls[item.id] = URL.createObjectURL(item.blob)
    setPreviewUrls(urls)
    return () => Object.values(urls).forEach(URL.revokeObjectURL)
  }, [customFish])

  return <div className="custom-fish-tools">
    <label className="fish-upload-button" title="仅保存到当前浏览器的本站；支持 PNG、JPG、WebP，最多 6 条鱼">
      <input className="fish-file-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={e => { const files = Array.from(e.currentTarget.files ?? []); if (files.length) onUploadFiles(files); e.currentTarget.value = '' }} aria-label="上传鱼的图片到鱼缸" />
      <span>＋</span> 上传鱼图
    </label>
    {customFish.length > 0 && <button className="fish-library-toggle" onClick={() => setLibraryOpen(v => !v)} aria-expanded={libraryOpen} aria-label={`管理已上传的 ${customFish.length} 条鱼图`}>鱼图 / {customFish.length}</button>}
    {libraryOpen && <section className="fish-library-panel" aria-label="管理自定义鱼图">
      <div className="fish-library-heading"><strong>自定义鱼群 <span>{String(9 + customFish.length).padStart(2, '0')}</span></strong><button onClick={() => setLibraryOpen(false)} aria-label="关闭自定义鱼列表">×</button></div>
      <p>图片仅保存在当前浏览器的本站；透明底横图效果更佳。</p>
      <div className="fish-library-list">{customFish.map(item => <div className="fish-library-item" key={item.id}>
        {previewUrls[item.id] ? <img src={previewUrls[item.id]} alt="" /> : <span className="fish-library-placeholder">◇</span>}
        <span title={item.name}>{item.name}</span>
        <button onClick={() => onRemoveCustomFish(item.id)} aria-label={`从鱼缸移除 ${item.name}`}>×</button>
      </div>)}</div>
      <div className="fish-upload-status" role="status" aria-live="polite">{uploadStatus || '支持 PNG、JPG、WebP；单张不超过 8 MB'}</div>
    </section>}
    {uploadStatus && !libraryOpen && <div className="fish-upload-toast" role="status" aria-live="polite">{uploadStatus}</div>}
  </div>
}
