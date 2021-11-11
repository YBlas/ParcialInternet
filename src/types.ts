
export type usuario = {
    user: string,
    pass: string
}

export type MONGOcharacter = {
    id: string,
    name: string,
    species: string,
    status: string,
    episode: episode[],
}

export type episode = {
    name: string,
    episode:string
}