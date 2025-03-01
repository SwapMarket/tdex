import Image from 'next/image'
import getConfig from 'next/config'
const { publicRuntimeConfig } = getConfig()

export default function Arrow({ onClick }: { onClick: () => void }) {
  return (
    <div className="has-text-centered">
      <figure className="image is-24x24 is-inline-block my-3">
        <Image
          src={`${publicRuntimeConfig.staticFolder}/images/icons/arrow.svg`}
          alt="arrow down logo"
          height={24}
          width={24}
          onClick={onClick}
        />
      </figure>
    </div>
  )
}
