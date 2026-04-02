export const toTitleCase = (phrase: string) => {
    return phrase
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export const capitalizeFirstLetter = (val: string) => {
    return val.charAt(0).toUpperCase() + val.slice(1);
}