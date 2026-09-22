const { appConfig } = require('../config/appConfig');

const parsePagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  let limit = parseInt(query.limit, 10) || appConfig.pagination.defaultLimit;
  limit = Math.min(Math.max(limit, 1), appConfig.pagination.maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

const buildPaginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1
});

module.exports = {
  parsePagination,
  buildPaginationMeta
};
