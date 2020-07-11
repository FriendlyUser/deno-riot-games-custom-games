import { writeJson } from "https://deno.land/std/fs/mod.ts"
import "https://deno.land/x/dotenv/load.ts"

const player_id = Deno.env.get('ACCOUNT_ID')
const region_url = 'https://na1.api.riotgames.com'
let riot_URL = new URL(`${region_url}/lol/match/v4/matchlists/by-account/${player_id}`)

enum HTTP {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

interface MatchlistDto {
  startIndex: number
  totalGames: number
  endIndex: number
  matches: Array<any>
}

function makeFetchOptions(
    riotKey = Deno.env.get('RIOT_API_KEY'),
    method: HTTP = HTTP.GET
): object {
  return {
      method: method,
      headers: { 
        "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept-Language":  "en-US,en;q=0.9",
        'X-Riot-Token': riotKey
      }
  }
}

function appendMatchHistory(riot_endpoint: string): Promise<MatchlistDto> {
  const riotKey = Deno.env.get('RIOT_API_KEY')
  console.log(riotKey)
  const options = makeFetchOptions(riotKey)
  return fetch(riot_endpoint, options)
  .then( (resp: any) => {
    console.log(resp)
    return resp.json() 
  })
  .then( (matchData: MatchlistDto) => {
    return matchData
  })
}

const max_iterations = 1000
let bIndex = 0
let eIndex = 100
let current_url = riot_URL
let riot_endpoint = null
let allMatches = []
let customGames = []

const sleep = (milliseconds: number) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

for (let i = 0; i < max_iterations; i++) {
    console.log(`beginIndex: ${bIndex} endIndex: ${eIndex}`)
    riot_endpoint = current_url.toString()
    const newMatches = await appendMatchHistory(riot_endpoint)
    await sleep(1500)
    current_url.searchParams.delete('beginIndex')
    current_url.searchParams.delete('endIndex')
    const {matches} = newMatches
    if (matches.length == 0) {
      console.log(`ENDING SCRIPT AT ${eIndex} with ${matches.length}`)
      break
    }
    // startIndex becomes endIndex
    bIndex = eIndex
    eIndex = eIndex + 100
    allMatches.push(newMatches.matches)

    // get new url
    current_url.searchParams.append('beginIndex', String(bIndex))
    current_url.searchParams.append('endIndex', String(eIndex))
}

await writeJson(
  "./allData.json",
  allMatches
);