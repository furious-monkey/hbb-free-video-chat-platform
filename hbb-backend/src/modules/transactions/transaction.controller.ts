import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { assertHasUser } from '../../middleware/verifyJwt';
import { authWithTTL } from '../../middleware/authWithTTL';
import { TransactionService } from './transaction.service';
import { format } from 'date-fns';

const getTransactionsCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(TransactionService);
    const filters = {
      userId: req.user.id,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      type: req.query.type as string,
      status: req.query.status as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      cursor: req.query.cursor as string,
    };
    const result = await serviceInstance.getTransactions(filters);

    return res.json({
      success: true,
      message: 'Transactions fetched successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getTransactionByIdCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(TransactionService);
    const { id } = req.params;
    const transaction = await serviceInstance.getTransactionById(id, req.user.id);

    return res.json({
      success: true,
      message: 'Transaction fetched successfully',
      data: { transaction },
    });
  } catch (err) {
    next(err);
  }
};

const getStatementDataCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(TransactionService);
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const statementData = await serviceInstance.generateStatementData(
      req.user.id,
      startDate,
      endDate
    );

    return res.json({
      success: true,
      message: 'Statement data generated successfully',
      data: statementData,
    });
  } catch (err) {
    next(err);
  }
};

const getInvoiceDataCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(TransactionService);
    const { id } = req.params;
    const transaction = await serviceInstance.getTransactionById(id, req.user.id);

    return res.json({
      success: true,
      message: 'Invoice data generated successfully',
      data: {
        transaction,
        invoiceNumber: transaction.id,
        date: format(new Date(transaction.createdAt), 'dd/MM/yyyy'),
      },
    });
  } catch (err) {
    next(err);
  }
};

const router = Router();

router.get('/', authWithTTL, getTransactionsCtrl);
router.get('/:id', authWithTTL, getTransactionByIdCtrl);
router.get('/statement', authWithTTL, getStatementDataCtrl);
router.get('/invoice/:id', authWithTTL, getInvoiceDataCtrl);

export default router;