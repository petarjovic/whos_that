import loadingSpinner from "../assets/BeanEaterLoadingSpinner.svg";

const WaitingRoom = ({ gameId }: { gameId: string }) => {
    return (
        <>
            <img className="mt-30" src={loadingSpinner} alt="Your SVG" />
            <p className="text-shadow-xs/80 mx-auto mt-auto text-4xl font-semibold text-white">
                Waiting in room:{" "}
                <span className="text-shadow-xs/100 align-sub text-6xl font-bold tracking-tight text-amber-500">
                    {gameId || "..."}
                </span>
            </p>
            <p className="text-shadow-xs/80 m-auto text-center text-xl font-semibold text-white">
                Send this code to your opponent!
                <br></br>
                <span className="text-sm">(or send them the link to this page)</span>
            </p>
        </>
    );
};
export default WaitingRoom;
