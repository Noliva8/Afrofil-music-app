


import { FiUser, FiSearch } from 'react-icons/fi';

const UserMobileHeader = () => {
  return (
    <header className="mobile-header">
      <button className="profile-btn">
        <FiUser />
      </button>
      <h1>Browse</h1>
      <button className="search-btn">
        <FiSearch />
      </button>
    </header>
  );
};

export default UserMobileHeader;
