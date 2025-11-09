import Image from 'next/image';
import dottedface from '@/media/dottedface.gif';

export default function DottedFace() {
    return (
        <div className="w-full aspect-square flex justify-center items-center">
           <Image 
                src={dottedface} 
                alt="loading..." 
                className="w-full h-full object-contain"
                width={500}
                height={500}
                priority
                loading="eager"
            />
        </div>
    );
}