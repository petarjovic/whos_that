const WaitingRoom = ({ gameId }) => {
    return (
        <div className="border-4 border-zinc-950 text-4xl text-white bg-blue-500 m-auto p-3">
            Waiting For Players in room: {gameId}
        </div>
    );
};
export default WaitingRoom;
