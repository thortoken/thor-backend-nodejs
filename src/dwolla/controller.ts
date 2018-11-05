import {Errors, Path, POST} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import * as dwolla from '../dwolla';
import {event} from './index';
import {IEvent} from './event';
import {Tags} from 'typescript-rest-swagger';
import {TransactionService} from '../transaction/service';

@Tags('dwolla')
@Path('/dwolla/events')
export class DwollaController extends BaseController {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private transactionService: TransactionService;

    @POST
    @Path('')
    async events(data: IEvent) {
        this.transactionService.setRequestContext(this.getRequestContext());

        try {
            const _event = event.factory(data);
            console.log('Dwolla event:\n', JSON.stringify(_event, null, 2));
            await this.dwollaClient.authorize();

            switch (_event.topic) {
                case event.TYPE.transferCreated:
                    this.logger.info(_event);
                    break;
                case event.TYPE.transferCanceled:
                case event.TYPE.transferFailed:
                case event.TYPE.transferReclaimed:
                case event.TYPE.transferCompleted: {
                    this.logger.info(_event);
                    const id = _event._links['resource']['href'];

                    if (!id) {
                        this.logger.error('Missing resource href link');
                        return;
                    }

                    const transaction = await this.transactionService.getDwollaByTransferExternalId(id);
                    if (!transaction) {
                        throw new Errors.NotFoundError('Transaction not found');
                    }

                    await this.transactionService.updateTransactionStatus(transaction, _event.topic);
                    break;
                }
                default:
                    this.logger.info(_event);
            }
        } catch (e) {
            this.logger.error(e.message);
        }
    }
}
