import type { CardDataUrl } from "@server/types";
import { CardLayout, OpponentTargetCard } from "../misc/Cards";
import { type JSX } from "react";
import { emitChooseCharacter } from "../../lib/socket";
import GameBoard from "./GameBoard";
import dice from "../../assets/dice.jpg";

//component which allows players to choose character for the opponent to guess
const CharacterPicker = ({
    cardData,
    roomId,
    setCharName,
}: {
    cardData: CardDataUrl[];
    roomId: string;
    setCharName: (name: string) => void;
}) => {
    const cardSelectorList: JSX.Element[] = [];

    for (const char of cardData) {
        cardSelectorList.push(
            <button
                key={char.orderIndex}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCharName(char.name);
                    emitChooseCharacter(roomId, char.orderIndex);
                }}
                className="cursor-pointer"
            >
                <CardLayout name={char.name} imgSrc={char.imageUrl} size={"L"}>
                    <></>
                </CardLayout>
            </button>
        );
    }

    const randomCharacterCard = (
        <button
            key={cardData.length + 1}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCharName("Random🎲");
                emitChooseCharacter(roomId, -1);
            }}
            className="cursor-pointer"
        >
            <OpponentTargetCard name={"Random"} imgSrc={dice} />
        </button>
    );

    return <GameBoard cardList={cardSelectorList} targetCard={randomCharacterCard} />;
};
export default CharacterPicker;
