import loadingSpinner from "./assets/BeanEaterLoadingSpinner.svg";

const WaitingRoom = ({ gameId }) => {
    return (
        <>
            <img className="mt-25" src={loadingSpinner} alt="Your SVG" />
            <div className="flex justify-center-safe items-center-safe border-4 border-zinc-950 text-4xl font-medium text-white bg-blue-500 mt-25 p-3">
                Waiting for another player to join room:
                <span className="ml-3 font-bold text-4xl text-amber-500"> {gameId}</span>
            </div>
        </>
    );
};
export default WaitingRoom;
