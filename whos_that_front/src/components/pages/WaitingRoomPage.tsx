import loadingSpinner from "../../assets/BeanEaterLoadingSpinner.svg";

const WaitingRoom = ({ gameId }: { gameId: string }) => {
    return (
        <>
            <img className="max-2xl:mt-23 mt-32 text-center" src={loadingSpinner} alt="Your SVG" />
            <p className="text-shadow-xs/90 mx-auto mt-auto text-center text-4xl font-semibold text-white max-2xl:text-3xl">
                Waiting in room:{" "}
                <span className="text-shadow-xs/90 align-sub text-6xl font-bold tracking-tight text-amber-500 max-2xl:text-5xl">
                    {gameId || "..."}
                </span>
            </p>
            <p className="text-shadow-xs/90 m-auto text-center text-xl font-semibold text-white max-2xl:text-lg">
                Send this code to your opponent!
                <br></br>
                <span className="text-sm">(or send them the link to this page)</span>
            </p>
        </>
    );
};
export default WaitingRoom;
