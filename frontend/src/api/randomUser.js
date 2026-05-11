import axios from 'axios'

export const getRandomInstructor = () =>
  axios.get('https://randomuser.me/api/?nat=br').then((r) => {
    const u = r.data.results[0]
    return {
      name: `${u.name.first} ${u.name.last}`,
      picture: u.picture.medium,
    }
  })
