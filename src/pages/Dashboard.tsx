import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import updateLocale from "dayjs/plugin/updateLocale";
import { PreviousScore } from "../components/PreviousScore";
dayjs.extend(utc);
dayjs.extend(updateLocale);

const Dashboard = () => {
  // Character object
  const [characterData, setCharacterData] = useState<{
    name: string;
    class: string;
    level?: number;
    characterImg?: string;
    memberSince: string;
    scores: { score: number; date: string }[];
  }>({
    name: "",
    class: "",
    level: NaN,
    characterImg: "",
    memberSince: "",
    scores: [],
  });

  // Set the day of the week that the culvert score gets reset (Sunday)
  dayjs.updateLocale("en", {
    weekStart: 1,
  });

  const reset = dayjs()
    .utc()
    .startOf("week")
    .subtract(1, "day")
    .format("YYYY-MM-DD");

  // Fetch character data

  useEffect(() => {
    // Saku Bot API
    axios
      .get("http://localhost:3000/api/character/dìssatisfied")
      .then((res) => {
        setCharacterData((prevData) => ({
          ...prevData,
          name: res.data.name,
          class: res.data.class,
          memberSince: res.data.memberSince,
          scores: res.data.scores,
        }));
      })
      .catch((error) => {
        console.error("Error fetching character:", error);
      });

    // MapleStory Rankings API
    axios
      .get(
        "https://www.nexon.com/api/maplestory/no-auth/v1/ranking/na?type=overall&id=legendary&reboot_index=1&page_index=1&character_name=dìssatisfied"
      )
      .then((res) => {
        const characterImg = res.data.ranks[0].characterImgURL;
        const level = res.data.ranks[0]?.level;

        setCharacterData((prevData) => ({
          ...prevData,
          characterImg,
          level,
        }));
      })
      .catch((error) => {
        console.error("Error fetching character:", error);
      });
  }, []);

  // Get the current score of the character
  const getCurrentScore = () => {
    if (
      !characterData.scores ||
      characterData.scores[characterData.scores.length - 1]?.date !== reset
    )
      return 0;

    return characterData.scores[
      characterData.scores.length - 1
    ].score.toLocaleString();
  };

  // Get the best score of the character
  const getPersonalBest = () => {
    if (!characterData.scores) return 0;

    return Math.max(
      ...characterData.scores.map((score) => score.score),
      0
    ).toLocaleString();
  };

  // Get the participation rate of the character
  const getParticipationRate = () => {
    if (!characterData.scores) return "0/0 (0%)";

    const totalScores = characterData.scores.length;

    const missedScores = characterData.scores.filter(
      (score) => score.score === 0
    ).length;

    return `${totalScores - missedScores}/${totalScores} (${Math.round(
      ((totalScores - missedScores) / totalScores) * 100
    )}%)`;
  };

  // Get the trend for the character's score list
  const getScoreState = (
    score: { score: number },
    index: number,
    scores: { score: number }[]
  ) => {
    if (score.score === 0) return "invalid";

    return index === 0 || score.score > scores[index - 1].score
      ? "uptrend"
      : "downtrend";
  };

  // Get the lifetime score of the character
  const getLifetimeScore = () => {
    const sum = characterData.scores.reduce((accumulator, score) => {
      return accumulator + score.score;
    }, 0);

    return sum.toLocaleString();
  };

  return (
    <section className="flex justify-center items-center gap-x-6 p-12 h-full">
      {/* Live Chat & Feed */}
      <div className="bg-panel rounded-xl w-full h-full max-w-[375px]"></div>

      <div className="flex flex-col gap-6 w-full h-full max-w-[545px]">
        {/* Character Info */}
        <div className="flex items-center justify-center bg-panel rounded-xl gap-16 px-8 py-4 h-[105px]">
          <img src={characterData.characterImg} />
          <div>
            <h1 className="text-xl text-accent text-center">
              {characterData.name}
            </h1>
            <div className="flex justify-between">
              <h2>Level {characterData.level}</h2>
              <h2>{characterData.class}</h2>
            </div>
            <h2 className="flex justify-between gap-2">
              <h2>Member Since:</h2>
              <h2 className="text-accent">{characterData.memberSince}</h2>
            </h2>
          </div>
        </div>

        {/* Current / Best Score */}
        <div className="flex text-center gap-6 h-[80px]">
          <div className="bg-panel rounded-xl px-8 py-4 w-full">
            <h1 className="text-xl">Current Score</h1>
            <h2 className="text-xl text-accent">{getCurrentScore()}</h2>
          </div>
          <div className="bg-panel rounded-xl px-8 py-4 w-full">
            <h1 className="text-xl">Personal Best</h1>
            <h2 className="text-xl text-accent">{getPersonalBest()}</h2>
          </div>
        </div>

        {/* Culvert Graph */}
        <div className="bg-panel rounded-xl h-full"></div>
      </div>

      <div className="flex flex-col gap-6 w-full h-full max-w-[375px]">
        {/* Previous Scores */}
        <div className="flex flex-col justify-between items-center bg-panel rounded-xl p-8 h-full">
          <h1 className="text-xl">Previous Scores</h1>

          <div className="bg-tertiary/20 rounded-full w-full h-px" />

          <div className="flex flex-col gap-3 overflow-y-auto w-full h-full max-h-[420px]">
            {characterData.scores
              .map((score, index, scores) => (
                <PreviousScore
                  key={score.date}
                  state={getScoreState(score, index, scores)}
                  date={score.date}
                  score={score.score}
                />
              ))
              .reverse()}
          </div>

          <div className="bg-tertiary/20 rounded-full w-full h-px" />

          <h1 className="text-lg">
            Lifetime Scores:{" "}
            <span className="text-accent">{getLifetimeScore()}</span>
          </h1>
        </div>

        {/* Participation Rate */}
        <div className="flex flex-col justify-center items-center bg-panel rounded-xl px-8 py-4 h-[80px]">
          <h1 className="text-xl">Participation Rate</h1>
          <h2 className="text-accent">{getParticipationRate()}</h2>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
