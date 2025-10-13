import loadingSpinner from "../assets/BeanEaterLoadingSpinner.svg";

const WaitingRoom = ({ gameId }: { gameId: string }) => {
    return (
        <>
            <img className="mt-25" src={loadingSpinner} alt="Your SVG" />
            <p className="text-shadow-xs/80 mx-auto mt-auto text-3xl font-semibold tracking-wide text-white">
                Waiting in room:{" "}
                <span className="text-shadow-xs/100 align-sub text-5xl font-bold tracking-tight text-amber-500">
                    {gameId || "..."}
                </span>
            </p>
            <p className="text-shadow-xs/80 m-auto text-lg font-semibold tracking-wide text-white">
                Send this code to your opponent!
            </p>
        </>
    );
};
export default WaitingRoom;
