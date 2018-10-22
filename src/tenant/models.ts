import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import {Relation} from 'objection'; // for ManyToManyRelation compilation
import Joi = require('joi');
import {Profile} from '../profile/models';

export const enum Relations {
    profiles = 'profiles',
}

export class Tenant extends db.Model {
    static tableName = db.Tables.tenants;
    name?: string = null;
    dwollaUri?: string = null;
    dwollaStatus?: string = null;
    dwollaType?: string = null;
    firstName?: string = null;
    lastName?: string = null;
    phone?: string = null;
    email?: string = null;
    country?: string = null;
    state?: string = null;
    city?: string = null;
    postalCode?: string = null;
    address1?: string = null;
    address2?: string = null;
    businessName?: string = null;
    doingBusinessAs?: string = null;
    businessType?: string = null;
    businessClassification?: string = null;
    website?: string = null;

    static get relationMappings() {
        return {
            [Relations.profiles]: {
                relation: db.Model.HasManyRelation,
                modelClass: Profile,
                join: {
                    from: `${db.Tables.tenants}.id`,
                    to: `${db.Tables.profiles}.tenantId`
                }
            }
        };
    }

    get externalStatus() {
        return this.dwollaStatus;
    }

    get externalType() {
        return this.dwollaType;
    }

    get company() {
        return {
            firstName: this.firstName,
            lastName: this.lastName,
            phone: this.phone,
            email: this.email,
            country: this.country,
            state: this.state,
            city: this.city,
            postalCode: this.postalCode,
            address1: this.address1,
            address2: this.address2,
            businessName: this.businessName,
            doingBusinessAs: this.doingBusinessAs,
            website: this.website,
        };
    }
}

export class TenantBaseInfo extends Mapper {
    name: string = mapper.FIELD_STR;
}

export class TenantCompany extends Mapper {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    phone: string = mapper.FIELD_STR;
    email: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;
    state: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    businessName?: string = mapper.FIELD_STR;
    doingBusinessAs?: string = mapper.FIELD_STR;
    website?: string = mapper.FIELD_STR;
}

export class TenantResponse extends TenantBaseInfo {
    id: string = mapper.FIELD_STR;
    @mapper.object(TenantCompany)
    company: TenantCompany = new TenantCompany();
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
}

export class TenantOwnerAddressResponse extends Mapper {
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    stateProvinceRegion: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;
}

export class TenantOwnerResponse extends Mapper {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    title: string = mapper.FIELD_STR;
    @mapper.object(TenantOwnerAddressResponse)
    address: TenantOwnerAddressResponse = new TenantOwnerAddressResponse();
}

export class TenantOwnerAddressRequest extends Mapper {
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    stateProvinceRegion: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;
}

export class TenantOwnerRequest extends Mapper {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    title: string = mapper.FIELD_STR;
    @mapper.object(TenantOwnerAddressRequest)
    address: TenantOwnerAddressRequest = new TenantOwnerAddressRequest();
}

export class TenantCompanyRequest extends Mapper {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    phone: string = mapper.FIELD_STR;
    email: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;
    state: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    dateOfBirth: string = mapper.FIELD_STR;
    ssn: string = mapper.FIELD_STR;
    businessName: string = mapper.FIELD_STR;
    doingBusinessAs: string = mapper.FIELD_STR;
    businessType: string = mapper.FIELD_STR;
    businessClassification: string = mapper.FIELD_STR;
    ein: string = mapper.FIELD_STR;
    website: string = mapper.FIELD_STR;
    controller: TenantOwnerRequest = new TenantOwnerRequest();
}

export class TenantCompanyPatchRequest extends Mapper {
    company: TenantCompanyRequest = new TenantCompanyRequest();
}

export class TenantRequest extends TenantBaseInfo {
}

export const tenantRequestSchema = Joi.object().keys({
    name: Joi.string().required(),
    dwollaUri: Joi.string(),
});

export const tenantOwnerAddressSchema = Joi.object().keys({
    address1: Joi.string().required(),
    address2: Joi.string().allow('', null),
    city: Joi.string().required(),
    stateProvinceRegion: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required(),
});

export const tenantOwnerSchema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    title: Joi.string().required(),
    dateOfBirth: Joi.string().required(),
    ssn: Joi.string().required(),
    address: tenantOwnerAddressSchema.required(),
});

export const companyRequestSchema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().required().email(),
    dateOfBirth: Joi.string().required(),
    ssn: Joi.string().required().invalid(['0000']),
    country: Joi.string().required(),
    state: Joi.string().required().uppercase().length(2),
    city: Joi.string().required().regex(/[a-zA-Z]+/),
    postalCode: Joi.string().required(),
    address1: Joi.string().required().max(50),
    address2: Joi.string().allow('', null).max(50),
    businessName: Joi.string().required(),
    doingBusinessAs: Joi.string().allow('', null),
    businessType: Joi.string().required(),
    businessClassification: Joi.string().required(),
    ein: Joi.string().allow('', null),
    website: Joi.string().allow('', null),
    controller: tenantOwnerSchema,
});

export const tenantCompanyRequestSchema = Joi.object().keys({
    company: companyRequestSchema,
});
