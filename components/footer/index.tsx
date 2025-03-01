import Image from 'next/image'
import getConfig from 'next/config'
const { publicRuntimeConfig } = getConfig()

export default function Footer() {
  const commitHash = process.env.NEXT_PUBLIC_GIT_COMMIT || 'unknown'

  return (
    <div className="hero-foot mb-6">
      <div className="is-flex is-justify-content-center is-align-items-center">
        <p className="subtitle mb-0 mr-2">Swap powered by</p>
        <a
          target="_blank"
          href={`https://github.com/swapmarket/tdex/commit/${commitHash}`}
          rel="noreferrer"
        >
          <Image
            src={`/images/icons/tdex_logo.svg`} // Removed publicRuntimeConfig
            alt="tdex logo"
            height={64}
            width={64}
          />
        </a>
      </div>
    </div>
  )
}
