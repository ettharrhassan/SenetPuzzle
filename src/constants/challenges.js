import routeEasyImage from "../assets/images/route-easy-50.png";
import teamMediumImage from "../assets/images/team-medium-75.png";
import teamHardImage from "../assets/images/team-hard-100.png";

export const CHALLENGES = [
  {
    id: "route-easy-50",
    titleKey: "challengeRouteEasy",
    nameKey: "challengeRouteName",
    difficultyKey: "easy",
    art: "route",
    image: routeEasyImage,
    levelId: "pieces-15",
  },
  {
    id: "team-medium-75",
    titleKey: "challengeTeamMedium",
    nameKey: "challengeTeamName",
    difficultyKey: "medium",
    art: "team",
    image: teamMediumImage,
    levelId: "pieces-25",
  },
  {
    id: "team-hard-100",
    titleKey: "challengeTeamHard",
    nameKey: "challengeGroupName",
    difficultyKey: "hard",
    art: "gathering",
    image: teamHardImage,
    levelId: "pieces-50",
  },
];
