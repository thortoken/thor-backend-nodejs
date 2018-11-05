import {BaseController} from '../api';
import {AutoWired} from 'typescript-ioc';
import {Security, Tags} from 'typescript-rest-swagger';
import {DELETE, GET, PATCH, Path, PathParam, POST, Preprocessor, QueryParam} from 'typescript-rest';
import {
    AddBeneficialOwnerRequest,
    addBeneficialOwnerRequestSchema,
    BeneficialOwnerResponse,
    EditBeneficialOwnerRequest,
    editBeneficialOwnerRequestSchema,
    EditBeneficialOwnerResponse,
    PaginatedBeneficialOwnerResponse
} from './models';
import {
    AddBeneficialOwnerLogic,
    DeleteBeneficialOwnerLogic,
    EditBeneficialOwnerLogic,
    GetBeneficialOwnerLogic,
    GetBeneficialOwnersLogic
} from './logic';
import {Pagination} from '../db';
import * as dwolla from '../dwolla';
import * as Errors from 'typescript-rest/dist/server-errors';


@AutoWired
@Security('api_key')
@Path('/tenants/company')
@Tags('tenantCompany')
@Preprocessor(BaseController.requireAdmin)
export abstract class BeneficialOwnerController extends BaseController {
    @POST
    @Path('beneficialOwners')
    async addBeneficialOwner(request: AddBeneficialOwnerRequest): Promise<BeneficialOwnerResponse> {
        const validateResult: AddBeneficialOwnerRequest = await this.validate(request, addBeneficialOwnerRequestSchema);
        try {
            const logic = new AddBeneficialOwnerLogic(this.getRequestContext());
            const beneficialOwner = await logic.execute(validateResult, this.getRequestContext().getTenantId());
            return this.map(BeneficialOwnerResponse, beneficialOwner);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError(null, null);
            }
            throw new Errors.InternalServerError(err.message);
        }
    }

    @PATCH
    @Path('beneficialOwners')
    async editBeneficialOwner(request: EditBeneficialOwnerRequest): Promise<EditBeneficialOwnerResponse> {
        const validateResult: EditBeneficialOwnerRequest = await this.validate(request, editBeneficialOwnerRequestSchema);
        try {
            const logic = new EditBeneficialOwnerLogic(this.getRequestContext());
            const beneficialOwner = await logic.execute(validateResult);
            return this.map(EditBeneficialOwnerResponse, beneficialOwner);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError(null, null);
            }
            throw new Errors.InternalServerError(err.message);
        }
    }

    @GET
    @Path('beneficialOwners')
    async getBeneficialOwners(@QueryParam('page') page?: number, @QueryParam('limit') limit?: number): Promise<PaginatedBeneficialOwnerResponse> {
        try {
            const logic = new GetBeneficialOwnersLogic(this.getRequestContext());
            const beneficialOwners = await logic.execute(this.getRequestContext().getTenantId());
            const pagination = new Pagination(page, limit, beneficialOwners.length);

            return this.paginate(
                pagination,
                beneficialOwners.map(owner => {
                    return this.map(BeneficialOwnerResponse, owner);
                })
            );
        } catch (err) {
            throw new Errors.InternalServerError(err.message);
        }
    }

    @GET
    @Path('beneficialOwners/:id')
    async getBeneficialOwner(@PathParam('id') id: string): Promise<BeneficialOwnerResponse> {
        try {
            const logic = new GetBeneficialOwnerLogic(this.getRequestContext());
            const beneficialOwner = await logic.execute(id);
            return this.map(BeneficialOwnerResponse, beneficialOwner);
        } catch (err) {
            throw new Errors.InternalServerError(err.message);
        }
    }

    @DELETE
    @Path('beneficialOwners/:id')
    async deleteBeneficialOwner(@PathParam('id') id: string) {
        try {
            const logic = new DeleteBeneficialOwnerLogic(this.getRequestContext());
            await logic.execute(id);
        } catch (err) {
            throw new Errors.InternalServerError(err.message);
        }
    }
}