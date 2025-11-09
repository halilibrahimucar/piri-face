export default function VideoBox(props: any) {
    return (
        <div className="w-full h-full bg-black">
            <video 
                ref={props.video} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
            />
            <audio ref={props.audio} autoPlay></audio>
        </div>
    );
}