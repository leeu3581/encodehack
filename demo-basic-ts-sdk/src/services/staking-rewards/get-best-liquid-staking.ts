import { StakingRewardsResponse } from "./types";

const STAKING_REWARDS_API_ENDPOINT = "https://api.stakingrewards.com/public/query";

// Remove dotenv import and config
// import dotenv from "dotenv";
// dotenv.config();

interface StakingQueryParams {
  symbols?: string[];
  typeKeys?: string[];
  limit?: number;
}

const LIQUID_STAKING_QUERY = ({ symbols = ["ETH", "SOL"], typeKeys = ["liquid-staking"], limit = 15 }: StakingQueryParams) => `
    query GetBestLiquidStaking {
        rewardOptions(
            where: {
                inputAsset: { symbols: ${JSON.stringify(symbols)} }
                typeKeys: ${JSON.stringify(typeKeys)}
            }
            limit: ${limit}
            order: { metricKey_desc: "reward_rate" }
        ) {
            outputAssets(limit: 1) {
                symbol
                name
                logoUrl
            }
            providers(limit: 1) {
                name
                slug
                isVerified
            }
            metrics(
                where: {
                    metricKeys: [
                        "commission"
                        "staking_wallets"
                        "staked_tokens"
                        "reward_rate"
                        "staking_share"
                        "net_staking_flow_7d"
                    ]
                }
                limit: 6
            ) {
                label
                metricKey
                defaultValue
            }
        }
    }
`;

export const getBestLiquidStaking = async (params: StakingQueryParams = {}): Promise<StakingRewardsResponse> => {
    try {
        const response = await fetch(STAKING_REWARDS_API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": import.meta.env.VITE_STAKING_REWARDS_API_KEY,
            },
            body: JSON.stringify({ query: LIQUID_STAKING_QUERY(params) }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching liquid staking data:", error);
        throw error;
    }
};