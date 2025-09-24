import loadingSpinner from "../assets/BeanEaterLoadingSpinner.svg";

const WaitingRoom = ({ gameId }: { gameId: string }) => {
    return (
        <>
            <img className="mt-25" src={loadingSpinner} alt="Your SVG" />
            <p className="mx-auto mt-auto text-3xl font-semibold">
                Created game with id:{" "}
                <span className="text-5xl font-black text-amber-600">{gameId || "..."}</span>
            </p>
            <p className="m-auto text-lg font-semibold">Send this code to your opponent!</p>
        </>
    );
};
export default WaitingRoom;
