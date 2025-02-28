import Image from 'next/image'
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

export default function Footer() {
  return (
    <div className="hero-foot">
      <div className="is-flex is-justify-content-center is-align-items-center">
        <p className="subtitle mb-0 mr-2">Swap powered by</p>
        <a target="_blank" href="https://tdex.network" rel="noreferrer">
          <Image
            src={`${publicRuntimeConfig.staticFolder}/images/icons/tdex_logo.svg`}
            alt="tdex logo"
            height={64}
            width={64}
          />
        </a>
      </div>
    </div>
  )
}
