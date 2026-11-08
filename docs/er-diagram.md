# Data model

```mermaid
erDiagram
  USER ||--o{ ITEM : owns
  USER ||--o{ FRIENDSHIP : "requests / receives"
  USER ||--o{ GROUP : owns
  GROUP }o--o{ USER : "has members"
  ITEM ||--o{ SHARE : "is shared as"
  USER ||--o{ SHARE : sends
  SHARE }o--o| USER : "to (friend)"
  SHARE }o--o| GROUP : "to (group)"
  SHARE ||--o{ INBOX_ENTRY : "lands as"
  USER ||--o{ INBOX_ENTRY : receives
  ITEM }o--o| SHARE : "saved from (fromShare)"

  USER {
    ObjectId _id
    string name
    string handle UK
    string email UK
    string passwordHash
    string bio
    number hue
    object prefs "who, status, pub, digest, dust"
    ObjectId[] shelf "ordered item ids"
    string[] collections
    object[] customTypes "key, label, plural, icon"
    date notificationsSeenAt
    date passwordChangedAt
    string resetTokenHash
    date resetExpires
  }
  ITEM {
    ObjectId _id
    ObjectId owner FK
    string url
    string title
    string type
    string[] tags
    number mins
    string status "queue | progress | done"
    bool fav
    string note
    string coll
    date remindAt
    ObjectId fromShare FK
    date createdAt "savedAt"
  }
  FRIENDSHIP {
    ObjectId _id
    ObjectId requester FK
    ObjectId recipient FK
    string pair UK "both ids, sorted"
    string status "pending | accepted"
    date acceptedAt
  }
  GROUP {
    ObjectId _id
    ObjectId owner FK
    string name
    string desc
    ObjectId[] members "includes owner"
  }
  SHARE {
    ObjectId _id
    ObjectId item FK
    ObjectId from FK
    string kind "friend | group"
    ObjectId toUser FK
    ObjectId toGroup FK
    string url "copy of the link"
    string title
    string type
    number mins
    string msg
    string seen "new | opened | done (friend)"
    date seenAt
    object[] done "user, at (group)"
    string react
  }
  INBOX_ENTRY {
    ObjectId _id
    ObjectId recipient FK
    ObjectId share FK
    ObjectId from FK
    string state "new | saved | dismissed"
  }
```

**Cascades** (done in services):
- **Deleting an item** deletes its shares and their inbox entries.
- **Removing a friend** deletes direct shares and their entries, both ways.
- **Leaving a group** (or being removed) deletes your entries for its shares. When the owner leaves, the group is deleted with its shares.
- **Deleting an account** removes the user's items, sent and received shares, inbox entries, friendships and owned groups, and takes them out of other groups.
