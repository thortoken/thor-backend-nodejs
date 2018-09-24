import {Model as OModel, transaction} from 'objection';
import {Inject} from 'typescript-ioc';
import {Config} from './config';
import {Errors} from '../node_modules/typescript-rest';

const validate = require('uuid-validate');
const uuid = require('uuid');
const getNamespace = require('continuation-local-storage').getNamespace;

export {OModel};

export class Model extends OModel {
    id: string;
    createdAt?: Date;
    updatedAt?: Date;

    $beforeInsert() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.id = uuid.v4();
    }

    $beforeUpdate() {
        this.updatedAt = new Date();
    }
}

export const enum Tables {
    users = 'users',
    profiles = 'profiles',
    tenants = 'tenants',
    roles = 'roles',
    profilesRoles = 'profilesRoles',
    transactions = 'transactions',
    jobs = 'jobs',
    transfers = 'transfers',
    ranks = 'ranks',
}

export class Pagination {
    total: number;
    limit: number;
    page: number;
    pages: number;

    constructor(page, limit, total: number) {
        this.page = page;
        this.limit = limit;
        this.total = total;
        this.pages = Math.ceil(total / limit);
    }
}

export class Paginated<T> {
    pagination: Pagination;
    rows: Array<T>;

    constructor(pagination: Pagination, rows: Array<T>) {
        this.pagination = pagination;
        this.rows = rows;
    }
}

// WARNING: @Inject only through constructor not field annotation to persist namespace context
export class ModelService<T> {
    @Inject protected config: Config;
    protected modelType;
    // TODO: change to protected when file upload is fixed
    public tenant: any;

    private getTenant() {
        if (!getNamespace('authContext')) {
            return null;
        }

        return getNamespace('authContext').get('tenant');
    }

    constructor() {
        this.tenant = this.getTenant();
    }

    getOptions(query) {
        return query;
    }

    getListOptions(query) {
        return query;
    }

    embed(query, embed) {
        return query;
    }

    paginationLimit(limit?: number) {
        if (!limit) {
            return this.config.get('pagination.limit');
        }

        return limit;
    }

    addPagination(query: any, page, limit: number) {
        if (!page) {
            page = 1;
        }

        limit = this.paginationLimit(limit);
        query.page(page - 1, limit);
        return {page, limit};
    }

    async get(id: string): Promise<T> {
        if (!validate(id)) {
            throw new Errors.BadRequestError('Invalid id format');
        }

        const query = this.modelType.query().findById(id);

        this.getOptions(query);

        return await this.tenantContext(query);
    }

    async getForAllTenants(id: string): Promise<T> {
        if (!validate(id)) {
            return undefined;
        }
        const query = this.modelType.query().findById(id);
        return await this.getOptions(query);
    }

    async getOneBy(field: string, value: any) {
        return await this.tenantContext(this.getOptions(this.modelType.query().findOne({[field]: value})));
    }

    async list(page?: number, limit?: number, filter?: any, embed?: string): Promise<Paginated<T>> {
        const query = this.modelType.query();

        if (filter) {
            query.where(filter);
        }
        this.embed(query, embed);
        this.getListOptions(query);
        const pag = this.addPagination(query, page, limit);

        const result = await this.tenantContext(query);
        return new Paginated(new Pagination(pag.page, pag.limit, result.total), result.results);
    }

    transaction(trx?: transaction<any>) {
        if (!trx) {
            return this.modelType.knex();
        }

        return trx;
    }

    tenantContext(query) {
        return query;
    }

    async insert(entity: OModel, trx?: transaction<any>): Promise<T> {
        const response = await this.modelType
            .query(this.transaction(trx))
            .insert(entity)
            .returning('*');

        if (!(response instanceof Array)) {
            return response;
        } else {
            return response[0];
        }
    }

    async update(entity: OModel, trx?: transaction<any>): Promise<any> {
        return await entity
            .$query(this.transaction(trx))
            .patch(entity.toJSON())
            .returning('*')
            .first();
    }

    getTenantId(): string {
        return this.tenant;
    }
}
