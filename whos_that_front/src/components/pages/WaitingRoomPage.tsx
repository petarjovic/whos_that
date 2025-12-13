import loadingSpinner from "../../assets/BeanEaterLoadingSpinner.svg";
import type { CardDataUrlType } from "@server/types";
import { CardLayout } from "../misc/Cards.tsx";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";

/**
 * Waiting page displayed while waiting for second player to join
 * Shows room code for opponent to use
 */
const WaitingRoom = ({ gameId, cardData }: { gameId: string; cardData: CardDataUrlType[] }) => {
    const cardList = cardData.map(({ imageUrl, name, orderIndex }) => (
        <CardLayout name={name} imgSrc={imageUrl} key={orderIndex} size={"S"}></CardLayout>
    ));

    return (
        <>
            <p className="mx-auto mb-px mt-5 text-center text-4xl font-medium text-zinc-800 max-2xl:text-3xl">
                Waiting in room:{" "}
                <span className="text-shadow-2xs/100 align-sub text-6xl font-bold tracking-tight text-amber-500 max-2xl:text-5xl">
                    {gameId || "..."}
                </span>
            </p>
            <p className="mx-auto text-center text-xl font-medium text-gray-800">
                Send this code to your opponent!
                <br></br>
                <span className="text-sm">(or send them the link to this page)</span>
            </p>
            <img className="max-h-40 text-center" src={loadingSpinner} alt="loading icon" />
            {/* Character Preview */}
            <div className="w-9/10 mx-auto mb-8 mt-5 border border-black bg-neutral-300 px-3 pb-3 pt-2 max-sm:mb-5">
                <p className="mb-1 text-2xl font-medium">Characters Preview</p>
                {cardData.length === 0 ? (
                    <LoadingSpinner />
                ) : (
                    <div className="flex flex-wrap items-center justify-around gap-2">
                        {cardList}
                    </div>
                )}
            </div>
        </>
    );
};
export default WaitingRoom;
