import loadingSpinner from "../assets/BeanEaterLoadingSpinner.svg";

const WaitingRoom = ({ gameId }: { gameId: string }) => {
    return (
        <>
            <img className="mt-25" src={loadingSpinner} alt="Your SVG" />
            <p className="text-shadow-xs/30 mx-auto mt-auto text-3xl font-semibold text-white">
                Waiting in room:{" "}
                <span className="text-shadow-xs/30 align-sub text-5xl font-black text-amber-500">
                    {gameId || "..."}
                </span>
            </p>
            <p className="text-shadow-xs/30 m-auto text-lg font-semibold text-white">
                Send this code to your opponent!
            </p>
        </>
    );
};
export default WaitingRoom;
