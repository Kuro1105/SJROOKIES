import { useState } from 'react'

export default function PhotoGallery({ urls }) {
  const [lightbox, setLightbox] = useState(null)
  if (!urls?.length) return null

  return (
    <>
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Photos</p>
        <div className="flex gap-2 flex-wrap">
          {urls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightbox(url)}
              className="w-24 h-24 rounded-xl overflow-hidden border border-sand-300 shrink-0 hover:opacity-80 transition-opacity cursor-zoom-in"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-6"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
