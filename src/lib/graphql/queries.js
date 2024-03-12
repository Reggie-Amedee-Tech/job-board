import { ApolloClient, ApolloLink, concat, createHttpLink, gql, InMemoryCache } from '@apollo/client'
import { getAccessToken } from '../auth'

const httpLink = createHttpLink({ uri: 'http://localhost:9000/graphql' })

const authLink = new ApolloLink((operation, forward) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    operation.setContext({
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
  }
  return forward(operation)
})

const jobDetailFragment = gql`
  fragment JobDetail on Job {
    id
    date
    title
    company {
      id
      name
    }
    description
  }
`;

export const apolloClient = new ApolloClient({
  link: concat(authLink, httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'network-only'
    },
    watchQuery: {
      fetchPolicy: 'network-only'
    }
  }
})

export const createJobMutation = gql`
  mutation createJob($input: CreateJobInput!) {
  job: createJob(input: $input) {
    ...JobDetail
  }
}
${jobDetailFragment}
`;

export const jobsQuery = gql`
    query Jobs{
        jobs {
        id
        date
        title
        company {
          id
          name
        }
      }
    }
`

export const companyByIdQuery = gql`
  query CompnayById($id: ID!) {
  company(id: $id) {
    id
    name
    description
      jobs {
      id
      date
      title
    }
  }
}
`

export const jobByIdQuery = gql`
    query JobById($id: ID!) {
  job(id: $id) {
    ...JobDetail
  }
}
${jobDetailFragment}
`

export async function getJobs() {
  const query = gql`
    query Jobs{
        jobs {
    id
    date
    title
        company {
      id
      name
    }
  }
}
`
  const { data } = await apolloClient.query({ query });
  return data.jobs
}

export async function getJob(id) {

  const result = await apolloClient.query({ query: jobByIdQuery, variables: { id } })
  return result.data.job

}

export async function getCompany(id) {
  const query = gql`
  query CompanyById($id: ID!) {
  company(id: $id) {
    description
    name
    id
    jobs {
      id
      date
      title
    }
  }
}
`
  const { data } = await apolloClient.query({ query, variables: { id } })
  return data.company
}