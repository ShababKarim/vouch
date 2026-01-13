import Image from 'next/image';
import logo from '../../../public/logo.svg';

export default function Logo() {
  return <Image src={logo} alt="Vouch" width="100" height="30" />;
}
