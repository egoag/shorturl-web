import React, { useState } from 'react'
import { gql } from 'apollo-boost'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/react-hooks'

import Error from './Error'
import { GetDomain } from '../lib/url'

const GET_URL_VERSIONS = gql`
  query getUrlbyId($id: ID!) {
    getUrlbyId(id: $id) {
      versions {
        count
        lastKey
        items {
          url
          varies
          createdAt
        }
      }
    }
  }
`

const UPDATE_URL = gql`
mutation UpdateUrl($id: ID!, $url: String!) {
  updateUrl(id: $id, url: $url) {
    id
    url
    varies
    latest
  }
}
`

const UrlVersions = ({ id }) => {
  const { loading, error, data, fetchMore } = useQuery(GET_URL_VERSIONS, { variables: { id } })
  if (loading) return <div>Loading...</div>
  if (error) return <Error error={error.message} />
  if (!data || !data.getUrlbyId || !data.getUrlbyId.versions || !data.getUrlbyId.versions.items) return <Error />

  const { items, lastKey } = data.getUrlbyId.versions
  return (
    <ul>
      {items.length > 1 // first is latest, ignore
        ? <div>
          {items.slice(1).map(item => {
            const domain = GetDomain(item.url)
            return (
              <li>
                <span title={item.url}>{item.varies} {item.createdAt} {domain}</span>
              </li>
            )
          })}
          {lastKey
            ? <button onClick={() => {
              fetchMore({
                query: GET_URL_VERSIONS,
                updateQuery: (previousResult, { fetchMoreResult }) => {
                  const { count: previousCount, items: previousItems } = previousResult.getUrlbyId.versions
                  const { count, items, lastKey } = fetchMoreResult.getUrlbyId.versions
                  return {
                    getUrlbyId: {
                      versions: {
                        count: count + previousCount,
                        lastKey,
                        items: [...previousItems, ...items]
                      }
                    }
                  }
                }
              })
            }}>More</button>
            : null
          }
        </div>
        : <div>no version</div>
      }
    </ul>
  )
}

const Url = ({ url: { id, url, latest } }) => {
  const [newUrl, updateNewUrl] = useState(url)
  const [isVersion, toggleVersion] = useState(false)
  const [isModifying, setIsModifying] = useState(false)
  const [updateUrl, { loading, error }] = useMutation(UPDATE_URL, { variables: { id } })

  if (error) {
    console.log('update error', error)
  }

  const domain = GetDomain(url)
  const updateModify = () => {
    setIsModifying(!isModifying)
    updateUrl({ variables: { url: newUrl } })
  }
  const toggleModify = () => {
    setIsModifying(!isModifying)
  }
  const cancelModify = () => {
    setIsModifying(!isModifying)
    updateNewUrl(url)
  }

  return (
    <li>
      <span className="url-id">
        {
          domain
            ? <span>
              <Link to={`/${id}`} target="_blank" rel="noopener noreferrer" >
                {id}
              </Link>
              {isModifying
                ? <input className="url-modify" onChange={e => updateNewUrl(e.target.value)} value={newUrl} disabled={loading} ></input>
                : <span className="url-title" title={url}>({domain})</span> }
            </span>
            : <span>{id}</span>
        }
      </span>
      <span className="url-info">
        <span className="clickable" onClick={isModifying ? updateModify : toggleModify}>
          {isModifying ? 'Update' : 'Modify' }
        </span>
        {isModifying
          ? <span className="clickable" onClick={cancelModify}>Cancel</span>
          : null}
        <span className={`${latest > 0 ? 'clickable' : ''}`} onClick={() => toggleVersion(!isVersion)}>
          V{latest}{latest > 0 ? isVersion ? '▾' : '▴' : ''}
        </span>
      </span>
      {isVersion
        ? <UrlVersions id={id}/>
        : null}
    </li>
  )
}

export default Url
