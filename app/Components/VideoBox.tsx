export default function VideoBox(props: any) {
    return (
        <div className="fixed inset-0 z-10 bg-simligray">
            <video ref={props.video} autoPlay playsInline className="w-full h-full object-cover"></video>
            <audio ref={props.audio} autoPlay></audio>
        </div>
    );
}